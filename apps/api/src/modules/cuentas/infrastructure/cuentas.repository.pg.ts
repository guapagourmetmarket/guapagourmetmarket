import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { CuentaAbierta, CuentaItem, EstadoCuenta, NuevoCuentaItem } from '../domain/cuenta.entity';
import { CuentasRepository } from '../domain/cuentas.repository';
import { precioConDescuento } from '../../../shared/calculos';

@Injectable()
export class CuentasRepositoryPg implements CuentasRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listarAbiertas(): Promise<CuentaAbierta[]> {
    const { rows: cuentaRows } = await this.pool.query(
      `SELECT id, nombre, estado, venta_id, created_at FROM cuentas_abiertas
       WHERE estado = 'abierta' ORDER BY created_at ASC`,
    );
    if (cuentaRows.length === 0) return [];

    const ids = cuentaRows.map((r) => r.id);
    const { rows: itemRows } = await this.pool.query(
      `SELECT id, cuenta_id, producto_id, nombre, cantidad, precio_unitario
       FROM cuenta_items WHERE cuenta_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [ids],
    );
    const itemsPorCuenta = new Map<string, CuentaItem[]>();
    for (const r of itemRows) {
      const lista = itemsPorCuenta.get(r.cuenta_id) ?? [];
      lista.push(this.aItem(r));
      itemsPorCuenta.set(r.cuenta_id, lista);
    }

    return cuentaRows.map((r) => this.aCuenta(r, itemsPorCuenta.get(r.id) ?? []));
  }

  async obtener(id: string): Promise<CuentaAbierta> {
    const { rows: cuentaRows } = await this.pool.query(
      `SELECT id, nombre, estado, venta_id, created_at FROM cuentas_abiertas WHERE id = $1`,
      [id],
    );
    if (cuentaRows.length === 0) {
      throw new NotFoundException('La cuenta no existe.');
    }
    const { rows: itemRows } = await this.pool.query(
      `SELECT id, cuenta_id, producto_id, nombre, cantidad, precio_unitario
       FROM cuenta_items WHERE cuenta_id = $1 ORDER BY created_at ASC`,
      [id],
    );
    return this.aCuenta(cuentaRows[0], itemRows.map((r) => this.aItem(r)));
  }

  async abrir(nombre: string, abiertaPor: string): Promise<CuentaAbierta> {
    const { rows } = await this.pool.query(
      `INSERT INTO cuentas_abiertas (nombre, abierta_por) VALUES ($1, $2)
       RETURNING id, nombre, estado, venta_id, created_at`,
      [nombre, abiertaPor],
    );
    return this.aCuenta(rows[0], []);
  }

  async agregarItem(cuentaId: string, item: NuevoCuentaItem): Promise<CuentaAbierta> {
    await this.validarAbierta(cuentaId);

    if (item.productoId) {
      const { rows } = await this.pool.query(
        `SELECT nombre, precio_venta, descuento_porcentaje FROM productos WHERE id = $1 AND activo = true`,
        [item.productoId],
      );
      if (rows.length === 0) {
        throw new BadRequestException('Ese producto ya no existe o está desactivado.');
      }
      const producto = rows[0];
      const precioLista = Number(producto.precio_venta);
      const precioUnitario = precioConDescuento(
        precioLista,
        producto.descuento_porcentaje === null ? null : Number(producto.descuento_porcentaje),
      );
      await this.pool.query(
        `INSERT INTO cuenta_items (cuenta_id, producto_id, nombre, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4, $5)`,
        [cuentaId, item.productoId, producto.nombre, item.cantidad, precioUnitario],
      );
    } else {
      if (!item.descripcionLibre || item.precioUnitario === undefined) {
        throw new BadRequestException(
          'Un item sin producto necesita descripción y precio.',
        );
      }
      await this.pool.query(
        `INSERT INTO cuenta_items (cuenta_id, descripcion_libre, nombre, cantidad, precio_unitario)
         VALUES ($1, $2, $2, $3, $4)`,
        [cuentaId, item.descripcionLibre, item.cantidad, item.precioUnitario],
      );
    }

    return this.obtener(cuentaId);
  }

  async quitarItem(cuentaId: string, itemId: string): Promise<CuentaAbierta> {
    await this.validarAbierta(cuentaId);
    const { rowCount } = await this.pool.query(
      `DELETE FROM cuenta_items WHERE id = $1 AND cuenta_id = $2`,
      [itemId, cuentaId],
    );
    if (rowCount === 0) {
      throw new NotFoundException('Ese item ya no está en la cuenta.');
    }
    return this.obtener(cuentaId);
  }

  async marcarCerrada(cuentaId: string, ventaId: string): Promise<void> {
    await this.pool.query(
      `UPDATE cuentas_abiertas SET estado = 'cerrada', venta_id = $1, cerrada_en = now() WHERE id = $2`,
      [ventaId, cuentaId],
    );
  }

  async cancelar(cuentaId: string): Promise<void> {
    await this.validarAbierta(cuentaId);
    await this.pool.query(`DELETE FROM cuentas_abiertas WHERE id = $1`, [cuentaId]);
  }

  private async validarAbierta(cuentaId: string): Promise<void> {
    const { rows } = await this.pool.query(
      `SELECT estado FROM cuentas_abiertas WHERE id = $1`,
      [cuentaId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('La cuenta no existe.');
    }
    if (rows[0].estado !== 'abierta') {
      throw new BadRequestException('Esa cuenta ya está cerrada.');
    }
  }

  private aItem(row: Record<string, unknown>): CuentaItem {
    const cantidad = Number(row.cantidad);
    const precioUnitario = Number(row.precio_unitario);
    return {
      id: row.id as string,
      productoId: (row.producto_id as string) ?? null,
      nombre: row.nombre as string,
      cantidad,
      precioUnitario,
      subtotal: Math.round(cantidad * precioUnitario * 100) / 100,
    };
  }

  private aCuenta(row: Record<string, unknown>, items: CuentaItem[]): CuentaAbierta {
    return {
      id: row.id as string,
      nombre: row.nombre as string,
      estado: row.estado as EstadoCuenta,
      ventaId: (row.venta_id as string) ?? null,
      createdAt: (row.created_at as Date).toISOString(),
      items,
      total: items.reduce((acc, i) => acc + i.subtotal, 0),
    };
  }
}
