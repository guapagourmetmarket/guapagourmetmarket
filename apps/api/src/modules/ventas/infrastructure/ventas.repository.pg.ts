import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { NuevaVenta, Venta, VentaItem } from '../domain/venta.entity';
import { VentasRepository } from '../domain/ventas.repository';

const PUNTOS_POR_PESO = 1000;

const SELECT_VENTA = `
  SELECT id, numero, to_char(fecha, 'YYYY-MM-DD') AS fecha, cliente_id, cliente_nombre, descripcion,
         valor, metodo_pago, origen, pagado,
         to_char(fecha_vencimiento_pago, 'YYYY-MM-DD') AS fecha_vencimiento_pago
  FROM ventas
`;

@Injectable()
export class VentasRepositoryPg implements VentasRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(): Promise<Venta[]> {
    const { rows: ventaRows } = await this.pool.query(
      `${SELECT_VENTA} ORDER BY fecha DESC, created_at DESC`,
    );
    if (ventaRows.length === 0) return [];

    const ids = ventaRows.map((r) => r.id);
    const { rows: itemRows } = await this.pool.query(
      `SELECT id, venta_id, producto_id, nombre_producto, cantidad, precio_unitario, iva, subtotal
       FROM venta_items WHERE venta_id = ANY($1::uuid[])`,
      [ids],
    );

    const itemsPorVenta = new Map<string, VentaItem[]>();
    for (const r of itemRows) {
      const lista = itemsPorVenta.get(r.venta_id) ?? [];
      lista.push({
        id: r.id,
        productoId: r.producto_id,
        nombreProducto: r.nombre_producto,
        cantidad: r.cantidad,
        precioUnitario: Number(r.precio_unitario),
        iva: r.iva,
        subtotal: Number(r.subtotal),
      });
      itemsPorVenta.set(r.venta_id, lista);
    }

    return ventaRows.map((r) => this.aVenta(r, itemsPorVenta.get(r.id) ?? []));
  }

  async registrar(venta: NuevaVenta): Promise<Venta> {
    if (venta.fiado && !venta.clienteId) {
      throw new BadRequestException('Una venta fiada debe estar asociada a un cliente.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let clienteNombre = venta.clienteNombre ?? null;
      if (venta.clienteId) {
        const { rows: clienteRows } = await client.query(
          `SELECT nombre, activo FROM clientes WHERE id = $1 FOR UPDATE`,
          [venta.clienteId],
        );
        if (clienteRows.length === 0) {
          throw new BadRequestException('El cliente seleccionado ya no existe.');
        }
        if (!clienteRows[0].activo) {
          throw new BadRequestException('El cliente seleccionado está inactivo.');
        }
        clienteNombre = venta.clienteNombre ?? clienteRows[0].nombre;
      }

      const itemsConDatos: {
        productoId: string;
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        iva: number;
        subtotal: number;
        existenciasPrevias: number;
        costoPromedio: number | null;
      }[] = [];

      for (const item of venta.items) {
        const { rows } = await client.query(
          `SELECT nombre, precio_venta, iva, existencias, costo_promedio FROM productos WHERE id = $1 FOR UPDATE`,
          [item.productoId],
        );
        if (rows.length === 0) {
          throw new BadRequestException('Uno de los productos ya no existe.');
        }
        const producto = rows[0];
        if (producto.existencias < item.cantidad) {
          throw new BadRequestException(
            `Solo quedan ${producto.existencias} unidades de "${producto.nombre}".`,
          );
        }
        const precioUnitario = Number(producto.precio_venta);
        itemsConDatos.push({
          productoId: item.productoId,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario,
          iva: producto.iva,
          subtotal: precioUnitario * item.cantidad,
          existenciasPrevias: producto.existencias,
          costoPromedio: producto.costo_promedio === null ? null : Number(producto.costo_promedio),
        });
      }

      const totalItems = itemsConDatos.reduce((acc, i) => acc + i.subtotal, 0);
      const valorTotal = totalItems + (venta.valorLibre ?? 0);

      if (valorTotal <= 0) {
        throw new BadRequestException('La venta debe tener al menos un producto o un valor.');
      }

      const pagado = !venta.fiado;

      const { rows: ventaRows } = await client.query(
        `INSERT INTO ventas
          (fecha, cliente_id, cliente_nombre, descripcion, valor, metodo_pago, registrado_por,
           pagado, fecha_vencimiento_pago)
         VALUES (COALESCE($1, current_date), $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, numero, to_char(fecha, 'YYYY-MM-DD') AS fecha, cliente_id, cliente_nombre,
                   descripcion, valor, metodo_pago, origen, pagado,
                   to_char(fecha_vencimiento_pago, 'YYYY-MM-DD') AS fecha_vencimiento_pago`,
        [
          venta.fecha ?? null,
          venta.clienteId ?? null,
          clienteNombre,
          venta.descripcion ?? null,
          valorTotal,
          venta.metodoPago,
          venta.registradoPor,
          pagado,
          venta.fechaVencimientoPago ?? null,
        ],
      );
      const ventaRow = ventaRows[0];

      const items: VentaItem[] = [];
      for (const item of itemsConDatos) {
        const { rows: itemRows } = await client.query(
          `INSERT INTO venta_items
            (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, iva, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id, producto_id, nombre_producto, cantidad, precio_unitario, iva, subtotal`,
          [
            ventaRow.id,
            item.productoId,
            item.nombre,
            item.cantidad,
            item.precioUnitario,
            item.iva,
            item.subtotal,
          ],
        );
        await client.query(
          `UPDATE productos SET existencias = existencias - $1, updated_at = now() WHERE id = $2`,
          [item.cantidad, item.productoId],
        );
        await client.query(
          `INSERT INTO movimientos_inventario
            (producto_id, tipo, cantidad, costo_unitario, saldo_cantidad, referencia_tipo, referencia_id, registrado_por)
           VALUES ($1, 'salida', $2, $3, $4, 'venta', $5, $6)`,
          [
            item.productoId,
            -item.cantidad,
            item.costoPromedio,
            item.existenciasPrevias - item.cantidad,
            ventaRow.id,
            venta.registradoPor,
          ],
        );
        const r = itemRows[0];
        items.push({
          id: r.id,
          productoId: r.producto_id,
          nombreProducto: r.nombre_producto,
          cantidad: r.cantidad,
          precioUnitario: Number(r.precio_unitario),
          iva: r.iva,
          subtotal: Number(r.subtotal),
        });
      }

      if (venta.clienteId) {
        const puntosGanados = Math.floor(valorTotal / PUNTOS_POR_PESO);
        if (puntosGanados > 0) {
          const { rows: puntosRows } = await client.query(
            `UPDATE clientes SET puntos = puntos + $1, updated_at = now() WHERE id = $2 RETURNING puntos`,
            [puntosGanados, venta.clienteId],
          );
          await client.query(
            `INSERT INTO movimientos_puntos
              (cliente_id, tipo, puntos, saldo_puntos, referencia_tipo, referencia_id, motivo)
             VALUES ($1, 'acumulado', $2, $3, 'venta', $4, $5)`,
            [
              venta.clienteId,
              puntosGanados,
              puntosRows[0].puntos,
              ventaRow.id,
              `Puntos por venta No. ${ventaRow.numero}`,
            ],
          );
        }
      }

      await client.query('COMMIT');

      return this.aVenta(ventaRow, items);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async anular(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: ventaRows } = await client.query(
        `SELECT id, numero FROM ventas WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (ventaRows.length === 0) {
        throw new NotFoundException('La venta no existe o ya fue anulada.');
      }
      const numero = ventaRows[0].numero;

      const { rows: itemRows } = await client.query(
        `SELECT producto_id, cantidad FROM venta_items WHERE venta_id = $1`,
        [id],
      );
      for (const item of itemRows) {
        const { rows: prodRows } = await client.query(
          `UPDATE productos SET existencias = existencias + $1, updated_at = now()
           WHERE id = $2 RETURNING existencias`,
          [item.cantidad, item.producto_id],
        );
        await client.query(
          `INSERT INTO movimientos_inventario
            (producto_id, tipo, cantidad, saldo_cantidad, referencia_tipo, referencia_id, motivo)
           VALUES ($1, 'ajuste', $2, $3, 'anulacion_venta', $4, $5)`,
          [item.producto_id, item.cantidad, prodRows[0].existencias, id, `Anulación de venta No. ${numero}`],
        );
      }

      const { rows: puntosRows } = await client.query(
        `SELECT cliente_id, puntos FROM movimientos_puntos
         WHERE referencia_tipo = 'venta' AND referencia_id = $1 AND tipo = 'acumulado'`,
        [id],
      );
      for (const p of puntosRows) {
        const { rows: clienteRows } = await client.query(
          `UPDATE clientes SET puntos = puntos - $1, updated_at = now() WHERE id = $2 RETURNING puntos`,
          [p.puntos, p.cliente_id],
        );
        await client.query(
          `INSERT INTO movimientos_puntos
            (cliente_id, tipo, puntos, saldo_puntos, referencia_tipo, referencia_id, motivo)
           VALUES ($1, 'ajuste', $2, $3, 'venta', $4, $5)`,
          [
            p.cliente_id,
            -p.puntos,
            clienteRows[0].puntos,
            id,
            `Reversión de puntos por anulación de venta No. ${numero}`,
          ],
        );
      }

      await client.query(`DELETE FROM ventas WHERE id = $1`, [id]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listarCarteraClientes(): Promise<Venta[]> {
    const { rows } = await this.pool.query(
      `${SELECT_VENTA} WHERE pagado = false ORDER BY fecha_vencimiento_pago ASC NULLS LAST, fecha ASC`,
    );
    return rows.map((r) => this.aVenta(r, []));
  }

  async marcarPagada(id: string): Promise<Venta> {
    const { rows: updated } = await this.pool.query(
      `UPDATE ventas SET pagado = true WHERE id = $1 RETURNING id`,
      [id],
    );
    if (updated.length === 0) {
      throw new NotFoundException('Venta no encontrada.');
    }

    const { rows: ventaRows } = await this.pool.query(`${SELECT_VENTA} WHERE id = $1`, [id]);
    const { rows: itemRows } = await this.pool.query(
      `SELECT id, producto_id, nombre_producto, cantidad, precio_unitario, iva, subtotal
       FROM venta_items WHERE venta_id = $1`,
      [id],
    );
    return this.aVenta(
      ventaRows[0],
      itemRows.map((r) => ({
        id: r.id,
        productoId: r.producto_id,
        nombreProducto: r.nombre_producto,
        cantidad: r.cantidad,
        precioUnitario: Number(r.precio_unitario),
        iva: r.iva,
        subtotal: Number(r.subtotal),
      })),
    );
  }

  private aVenta(row: Record<string, unknown>, items: VentaItem[]): Venta {
    return {
      id: row.id as string,
      numero: Number(row.numero),
      fecha: row.fecha as string,
      clienteId: (row.cliente_id as string) ?? null,
      clienteNombre: (row.cliente_nombre as string) ?? null,
      descripcion: (row.descripcion as string) ?? null,
      valor: Number(row.valor),
      metodoPago: row.metodo_pago as Venta['metodoPago'],
      origen: row.origen as Venta['origen'],
      pagado: row.pagado as boolean,
      fechaVencimientoPago: (row.fecha_vencimiento_pago as string) ?? null,
      items,
    };
  }
}
