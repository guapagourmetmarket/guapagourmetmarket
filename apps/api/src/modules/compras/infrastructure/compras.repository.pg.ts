import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { Compra, CompraItem, NuevaCompra } from '../domain/compra.entity';
import { ComprasRepository } from '../domain/compras.repository';

const SELECT_COMPRA = `
  SELECT c.id, c.numero, to_char(c.fecha, 'YYYY-MM-DD') AS fecha, c.numero_factura_proveedor,
         c.subtotal, c.total, c.metodo_pago, c.notas, c.pagado,
         to_char(c.fecha_vencimiento_pago, 'YYYY-MM-DD') AS fecha_vencimiento_pago,
         c.proveedor_id, p.nombre AS proveedor_nombre
  FROM compras c
  JOIN proveedores p ON p.id = c.proveedor_id
`;

@Injectable()
export class ComprasRepositoryPg implements ComprasRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(): Promise<Compra[]> {
    const { rows: compraRows } = await this.pool.query(
      `${SELECT_COMPRA} ORDER BY c.fecha DESC, c.created_at DESC`,
    );
    if (compraRows.length === 0) return [];

    const ids = compraRows.map((r) => r.id);
    const { rows: itemRows } = await this.pool.query(
      `SELECT id, compra_id, producto_id, nombre_producto, cantidad, costo_unitario, subtotal,
              lote, to_char(fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento
       FROM compra_items WHERE compra_id = ANY($1::uuid[])`,
      [ids],
    );

    const itemsPorCompra = new Map<string, CompraItem[]>();
    for (const r of itemRows) {
      const lista = itemsPorCompra.get(r.compra_id) ?? [];
      lista.push(this.aItem(r));
      itemsPorCompra.set(r.compra_id, lista);
    }

    return compraRows.map((r) => this.aCompra(r, itemsPorCompra.get(r.id) ?? []));
  }

  async obtenerPorId(id: string): Promise<Compra> {
    const { rows } = await this.pool.query(`${SELECT_COMPRA} WHERE c.id = $1`, [id]);
    if (rows.length === 0) {
      throw new NotFoundException('Compra no encontrada.');
    }
    const { rows: itemRows } = await this.pool.query(
      `SELECT id, compra_id, producto_id, nombre_producto, cantidad, costo_unitario, subtotal,
              lote, to_char(fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento
       FROM compra_items WHERE compra_id = $1`,
      [id],
    );
    return this.aCompra(rows[0], itemRows.map((r) => this.aItem(r)));
  }

  async registrar(compra: NuevaCompra): Promise<Compra> {
    if (compra.items.length === 0) {
      throw new BadRequestException('La compra debe tener al menos un producto.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const itemsConDatos: {
        productoId: string;
        nombre: string;
        cantidad: number;
        costoUnitario: number;
        subtotal: number;
        lote?: string;
        fechaVencimiento?: string;
        existenciasPrevias: number;
        promedioPrevio: number;
      }[] = [];

      for (const item of compra.items) {
        const { rows } = await client.query(
          `SELECT nombre, existencias, coalesce(costo_promedio, precio_compra, 0) AS costo_promedio
           FROM productos WHERE id = $1 FOR UPDATE`,
          [item.productoId],
        );
        if (rows.length === 0) {
          throw new BadRequestException('Uno de los productos ya no existe.');
        }
        const producto = rows[0];
        itemsConDatos.push({
          productoId: item.productoId,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario,
          subtotal: item.cantidad * item.costoUnitario,
          lote: item.lote,
          fechaVencimiento: item.fechaVencimiento,
          existenciasPrevias: producto.existencias,
          promedioPrevio: Number(producto.costo_promedio),
        });
      }

      const subtotal = itemsConDatos.reduce((acc, i) => acc + i.subtotal, 0);

      const { rows: compraRows } = await client.query(
        `INSERT INTO compras
          (proveedor_id, fecha, numero_factura_proveedor, subtotal, total, metodo_pago, notas,
           registrado_por, pagado, fecha_vencimiento_pago)
         VALUES ($1, COALESCE($2, current_date), $3, $4, $4, $5, $6, $7, $8, $9)
         RETURNING id, numero`,
        [
          compra.proveedorId,
          compra.fecha ?? null,
          compra.numeroFacturaProveedor ?? null,
          subtotal,
          compra.metodoPago,
          compra.notas ?? null,
          compra.registradoPor,
          compra.metodoPago !== 'credito',
          compra.fechaVencimientoPago ?? null,
        ],
      );
      const compraId = compraRows[0].id;

      for (const item of itemsConDatos) {
        const { rows: itemRows } = await client.query(
          `INSERT INTO compra_items (compra_id, producto_id, nombre_producto, cantidad, costo_unitario, subtotal, lote, fecha_vencimiento)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING id`,
          [
            compraId,
            item.productoId,
            item.nombre,
            item.cantidad,
            item.costoUnitario,
            item.subtotal,
            item.lote ?? null,
            item.fechaVencimiento ?? null,
          ],
        );
        const compraItemId = itemRows[0].id;

        const nuevasExistencias = item.existenciasPrevias + item.cantidad;
        const nuevoPromedio =
          nuevasExistencias > 0
            ? (item.existenciasPrevias * item.promedioPrevio + item.cantidad * item.costoUnitario) /
              nuevasExistencias
            : item.costoUnitario;

        await client.query(
          `UPDATE productos SET existencias = $2, costo_promedio = $3, updated_at = now() WHERE id = $1`,
          [item.productoId, nuevasExistencias, nuevoPromedio],
        );

        if (item.lote || item.fechaVencimiento) {
          await client.query(
            `INSERT INTO lotes (producto_id, compra_item_id, codigo_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual)
             VALUES ($1,$2,$3,$4,$5,$5)`,
            [item.productoId, compraItemId, item.lote ?? null, item.fechaVencimiento ?? null, item.cantidad],
          );
        }

        await client.query(
          `INSERT INTO movimientos_inventario
            (producto_id, tipo, cantidad, costo_unitario, saldo_cantidad, referencia_tipo, referencia_id, registrado_por)
           VALUES ($1, 'entrada', $2, $3, $4, 'compra', $5, $6)`,
          [item.productoId, item.cantidad, item.costoUnitario, nuevasExistencias, compraId, compra.registradoPor],
        );
      }

      await client.query('COMMIT');
      return this.obtenerPorId(compraId);
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

      const { rows: compraRows } = await client.query(
        `SELECT id, numero FROM compras WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (compraRows.length === 0) {
        throw new NotFoundException('La compra no existe o ya fue anulada.');
      }
      const numero = compraRows[0].numero;

      const { rows: itemRows } = await client.query(
        `SELECT producto_id, cantidad FROM compra_items WHERE compra_id = $1`,
        [id],
      );

      for (const item of itemRows) {
        const { rows: actualRows } = await client.query(
          `SELECT nombre, existencias FROM productos WHERE id = $1 FOR UPDATE`,
          [item.producto_id],
        );
        const producto = actualRows[0];
        if (producto.existencias - item.cantidad < 0) {
          throw new BadRequestException(
            `No se puede anular: "${producto.nombre}" solo tiene ${producto.existencias} unidades en stock ` +
              `(la compra registró ${item.cantidad}). Es probable que haya un ajuste manual de por medio; ` +
              `corrige el inventario antes de anular esta compra.`,
          );
        }

        const { rows: prodRows } = await client.query(
          `UPDATE productos SET existencias = existencias - $1, updated_at = now()
           WHERE id = $2 RETURNING existencias`,
          [item.cantidad, item.producto_id],
        );
        const saldo = prodRows[0].existencias;

        await client.query(
          `INSERT INTO movimientos_inventario
            (producto_id, tipo, cantidad, saldo_cantidad, referencia_tipo, referencia_id, motivo)
           VALUES ($1, 'ajuste', $2, $3, 'anulacion_compra', $4, $5)`,
          [item.producto_id, -item.cantidad, saldo, id, `Anulación de compra No. ${numero}`],
        );
      }

      await client.query(`DELETE FROM compras WHERE id = $1`, [id]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listarCartera(): Promise<Compra[]> {
    const { rows } = await this.pool.query(
      `${SELECT_COMPRA} WHERE c.pagado = false ORDER BY c.fecha_vencimiento_pago ASC NULLS LAST, c.fecha ASC`,
    );
    return rows.map((r) => this.aCompra(r, []));
  }

  async marcarPagada(id: string): Promise<Compra> {
    const { rows } = await this.pool.query(
      `UPDATE compras SET pagado = true WHERE id = $1 RETURNING id`,
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Compra no encontrada.');
    }
    return this.obtenerPorId(id);
  }

  private aItem(row: Record<string, unknown>): CompraItem {
    return {
      id: row.id as string,
      productoId: row.producto_id as string,
      nombreProducto: row.nombre_producto as string,
      cantidad: row.cantidad as number,
      costoUnitario: Number(row.costo_unitario),
      subtotal: Number(row.subtotal),
      lote: (row.lote as string) ?? null,
      fechaVencimiento: (row.fecha_vencimiento as string) ?? null,
    };
  }

  private aCompra(row: Record<string, unknown>, items: CompraItem[]): Compra {
    return {
      id: row.id as string,
      numero: Number(row.numero),
      proveedorId: row.proveedor_id as string,
      proveedorNombre: row.proveedor_nombre as string,
      fecha: row.fecha as string,
      numeroFacturaProveedor: (row.numero_factura_proveedor as string) ?? null,
      subtotal: Number(row.subtotal),
      total: Number(row.total),
      metodoPago: row.metodo_pago as Compra['metodoPago'],
      notas: (row.notas as string) ?? null,
      pagado: row.pagado as boolean,
      fechaVencimientoPago: (row.fecha_vencimiento_pago as string) ?? null,
      items,
    };
  }
}
