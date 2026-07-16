import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import {
  CambiosCliente,
  Cliente,
  MovimientoPuntos,
  NuevoCliente,
} from '../domain/cliente.entity';
import { ClientesRepository } from '../domain/clientes.repository';
import { Venta, VentaItem } from '../../ventas/domain/venta.entity';

const SELECT_CLIENTE = `
  SELECT id, nombre, telefono, email, direccion,
         to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento, puntos, activo
  FROM clientes
`;

const SELECT_VENTA = `
  SELECT id, numero, to_char(fecha, 'YYYY-MM-DD') AS fecha, cliente_id, cliente_nombre, descripcion,
         valor, descuento, metodo_pago, origen, pagado,
         to_char(fecha_vencimiento_pago, 'YYYY-MM-DD') AS fecha_vencimiento_pago
  FROM ventas
`;

@Injectable()
export class ClientesRepositoryPg implements ClientesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(incluirInactivos = false): Promise<Cliente[]> {
    const where = incluirInactivos ? '' : 'WHERE activo = true';
    const { rows } = await this.pool.query(`${SELECT_CLIENTE} ${where} ORDER BY nombre ASC`);
    return rows.map((r) => this.aCliente(r));
  }

  async obtenerPorId(id: string): Promise<Cliente> {
    const { rows } = await this.pool.query(`${SELECT_CLIENTE} WHERE id = $1`, [id]);
    if (rows.length === 0) {
      throw new NotFoundException('Cliente no encontrado.');
    }
    return this.aCliente(rows[0]);
  }

  async crear(nuevo: NuevoCliente): Promise<Cliente> {
    const { rows } = await this.pool.query(
      `INSERT INTO clientes (nombre, telefono, email, direccion, fecha_nacimiento)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, telefono, email, direccion,
                 to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento, puntos, activo`,
      [
        nuevo.nombre,
        nuevo.telefono ?? null,
        nuevo.email ?? null,
        nuevo.direccion ?? null,
        nuevo.fechaNacimiento ?? null,
      ],
    );
    return this.aCliente(rows[0]);
  }

  async actualizar(id: string, cambios: CambiosCliente): Promise<Cliente> {
    const actual = await this.obtenerPorId(id);
    const { rows } = await this.pool.query(
      `UPDATE clientes SET nombre = $2, telefono = $3, email = $4, direccion = $5,
        fecha_nacimiento = $6, updated_at = now()
       WHERE id = $1
       RETURNING id, nombre, telefono, email, direccion,
                 to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento, puntos, activo`,
      [
        id,
        cambios.nombre ?? actual.nombre,
        cambios.telefono !== undefined ? cambios.telefono : actual.telefono,
        cambios.email !== undefined ? cambios.email : actual.email,
        cambios.direccion !== undefined ? cambios.direccion : actual.direccion,
        cambios.fechaNacimiento !== undefined ? cambios.fechaNacimiento : actual.fechaNacimiento,
      ],
    );
    return this.aCliente(rows[0]);
  }

  async cambiarEstado(id: string, activo: boolean): Promise<Cliente> {
    const { rows } = await this.pool.query(
      `UPDATE clientes SET activo = $2, updated_at = now() WHERE id = $1
       RETURNING id, nombre, telefono, email, direccion,
                 to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento, puntos, activo`,
      [id, activo],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Cliente no encontrado.');
    }
    return this.aCliente(rows[0]);
  }

  async listarMovimientosPuntos(clienteId: string): Promise<MovimientoPuntos[]> {
    const { rows } = await this.pool.query(
      `SELECT id, cliente_id, tipo, puntos, saldo_puntos, referencia_tipo, referencia_id, motivo, created_at
       FROM movimientos_puntos WHERE cliente_id = $1 ORDER BY created_at DESC`,
      [clienteId],
    );
    return rows.map((r) => ({
      id: r.id,
      clienteId: r.cliente_id,
      tipo: r.tipo,
      puntos: r.puntos,
      saldoPuntos: r.saldo_puntos,
      referenciaTipo: r.referencia_tipo,
      referenciaId: r.referencia_id ?? null,
      motivo: r.motivo ?? null,
      createdAt: r.created_at,
    }));
  }

  async canjearPuntos(clienteId: string, puntos: number, motivo: string): Promise<MovimientoPuntos> {
    if (puntos <= 0) {
      throw new BadRequestException('La cantidad de puntos a canjear debe ser mayor que cero.');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: clienteRows } = await client.query(
        `SELECT puntos FROM clientes WHERE id = $1 FOR UPDATE`,
        [clienteId],
      );
      if (clienteRows.length === 0) {
        throw new NotFoundException('Cliente no encontrado.');
      }
      if (clienteRows[0].puntos < puntos) {
        throw new BadRequestException(
          `El cliente solo tiene ${clienteRows[0].puntos} puntos disponibles.`,
        );
      }

      const { rows: actualizado } = await client.query(
        `UPDATE clientes SET puntos = puntos - $1, updated_at = now() WHERE id = $2 RETURNING puntos`,
        [puntos, clienteId],
      );

      const { rows: movRows } = await client.query(
        `INSERT INTO movimientos_puntos
          (cliente_id, tipo, puntos, saldo_puntos, referencia_tipo, motivo)
         VALUES ($1, 'canjeado', $2, $3, 'canje', $4)
         RETURNING id, cliente_id, tipo, puntos, saldo_puntos, referencia_tipo, referencia_id, motivo, created_at`,
        [clienteId, -puntos, actualizado[0].puntos, motivo],
      );

      await client.query('COMMIT');

      const r = movRows[0];
      return {
        id: r.id,
        clienteId: r.cliente_id,
        tipo: r.tipo,
        puntos: r.puntos,
        saldoPuntos: r.saldo_puntos,
        referenciaTipo: r.referencia_tipo,
        referenciaId: r.referencia_id ?? null,
        motivo: r.motivo ?? null,
        createdAt: r.created_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listarHistorialCompras(clienteId: string): Promise<Venta[]> {
    const { rows: ventaRows } = await this.pool.query(
      `${SELECT_VENTA} WHERE cliente_id = $1 ORDER BY fecha DESC, created_at DESC`,
      [clienteId],
    );
    if (ventaRows.length === 0) return [];

    const ids = ventaRows.map((r) => r.id);
    const { rows: itemRows } = await this.pool.query(
      `SELECT id, venta_id, producto_id, nombre_producto, cantidad, precio_unitario, iva, subtotal,
              cantidad_devuelta
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
        cantidadDevuelta: Number(r.cantidad_devuelta),
      });
      itemsPorVenta.set(r.venta_id, lista);
    }

    return ventaRows.map((r) => ({
      id: r.id,
      numero: Number(r.numero),
      fecha: r.fecha,
      clienteId: r.cliente_id ?? null,
      clienteNombre: r.cliente_nombre ?? null,
      descripcion: r.descripcion ?? null,
      valor: Number(r.valor),
      descuento: Number(r.descuento ?? 0),
      metodoPago: r.metodo_pago,
      origen: r.origen,
      pagado: r.pagado,
      fechaVencimientoPago: r.fecha_vencimiento_pago ?? null,
      items: itemsPorVenta.get(r.id) ?? [],
    }));
  }

  async listarCumpleanosDelMes(): Promise<Cliente[]> {
    const { rows } = await this.pool.query(
      `${SELECT_CLIENTE} WHERE activo = true AND fecha_nacimiento IS NOT NULL
        AND EXTRACT(month FROM fecha_nacimiento) = EXTRACT(month FROM current_date)
       ORDER BY EXTRACT(day FROM fecha_nacimiento) ASC`,
    );
    return rows.map((r) => this.aCliente(r));
  }

  private aCliente(row: Record<string, unknown>): Cliente {
    return {
      id: row.id as string,
      nombre: row.nombre as string,
      telefono: (row.telefono as string) ?? null,
      email: (row.email as string) ?? null,
      direccion: (row.direccion as string) ?? null,
      fechaNacimiento: (row.fecha_nacimiento as string) ?? null,
      puntos: Number(row.puntos),
      activo: row.activo as boolean,
    };
  }
}
