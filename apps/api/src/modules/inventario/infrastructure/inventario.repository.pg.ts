import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import {
  Alertas,
  MovimientoInventario,
} from '../domain/movimiento-inventario.entity';
import { InventarioRepository, NuevoAjuste } from '../domain/inventario.repository';

function aMovimiento(row: Record<string, unknown>): MovimientoInventario {
  return {
    id: row.id as string,
    productoId: row.producto_id as string,
    tipo: row.tipo as MovimientoInventario['tipo'],
    cantidad: row.cantidad as number,
    costoUnitario: row.costo_unitario === null ? null : Number(row.costo_unitario),
    saldoCantidad: row.saldo_cantidad as number,
    referenciaTipo: row.referencia_tipo as MovimientoInventario['referenciaTipo'],
    referenciaId: (row.referencia_id as string) ?? null,
    motivo: (row.motivo as string) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

@Injectable()
export class InventarioRepositoryPg implements InventarioRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listarMovimientos(productoId: string): Promise<MovimientoInventario[]> {
    const { rows } = await this.pool.query(
      `SELECT id, producto_id, tipo, cantidad, costo_unitario, saldo_cantidad,
              referencia_tipo, referencia_id, motivo, created_at
       FROM movimientos_inventario
       WHERE producto_id = $1
       ORDER BY created_at DESC`,
      [productoId],
    );
    return rows.map(aMovimiento);
  }

  async registrarAjuste(ajuste: NuevoAjuste): Promise<MovimientoInventario> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `SELECT existencias FROM productos WHERE id = $1 FOR UPDATE`,
        [ajuste.productoId],
      );
      if (rows.length === 0) {
        throw new BadRequestException('El producto ya no existe.');
      }
      const existencias = rows[0].existencias as number;
      const diferencia = ajuste.cantidadNueva - existencias;

      if (diferencia === 0) {
        await client.query('ROLLBACK');
        throw new BadRequestException('Las existencias ya son esa cantidad; no hay nada que ajustar.');
      }

      await client.query(
        `UPDATE productos SET existencias = $2, updated_at = now() WHERE id = $1`,
        [ajuste.productoId, ajuste.cantidadNueva],
      );

      const { rows: movRows } = await client.query(
        `INSERT INTO movimientos_inventario
          (producto_id, tipo, cantidad, saldo_cantidad, referencia_tipo, motivo, registrado_por)
         VALUES ($1, 'ajuste', $2, $3, 'ajuste_manual', $4, $5)
         RETURNING id, producto_id, tipo, cantidad, costo_unitario, saldo_cantidad,
                   referencia_tipo, referencia_id, motivo, created_at`,
        [ajuste.productoId, diferencia, ajuste.cantidadNueva, ajuste.motivo, ajuste.registradoPor],
      );

      await client.query('COMMIT');
      return aMovimiento(movRows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async obtenerAlertas(diasVencimiento = 30): Promise<Alertas> {
    const { rows: stockRows } = await this.pool.query(
      `SELECT p.id, p.nombre, c.nombre AS categoria_nombre, p.existencias, p.stock_minimo
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = true AND p.existencias <= p.stock_minimo
       ORDER BY p.existencias ASC, p.nombre`,
    );

    const { rows: loteRows } = await this.pool.query(
      `SELECT l.id AS lote_id, l.producto_id, p.nombre AS producto_nombre, l.codigo_lote,
              to_char(l.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
              l.cantidad_actual,
              (l.fecha_vencimiento - current_date) AS dias_restantes
       FROM lotes l
       JOIN productos p ON p.id = l.producto_id
       WHERE l.cantidad_actual > 0
         AND l.fecha_vencimiento IS NOT NULL
         AND l.fecha_vencimiento <= current_date + ($1 || ' days')::interval
       ORDER BY l.fecha_vencimiento ASC`,
      [diasVencimiento],
    );

    // Vencimiento puesto directo en el producto (sin pasar por un lote de
    // compra): mismo umbral de días, para que sirva también a quien no
    // registra sus compras en el sistema.
    const { rows: productoRows } = await this.pool.query(
      `SELECT p.id AS producto_id, p.nombre AS producto_nombre,
              to_char(p.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
              p.existencias,
              (p.fecha_vencimiento - current_date) AS dias_restantes
       FROM productos p
       WHERE p.activo = true
         AND p.fecha_vencimiento IS NOT NULL
         AND p.fecha_vencimiento <= current_date + ($1 || ' days')::interval
       ORDER BY p.fecha_vencimiento ASC`,
      [diasVencimiento],
    );

    const porVencer = [
      ...loteRows.map((r) => ({
        loteId: r.lote_id,
        productoId: r.producto_id,
        productoNombre: r.producto_nombre,
        codigoLote: r.codigo_lote,
        fechaVencimiento: r.fecha_vencimiento,
        cantidadActual: r.cantidad_actual,
        diasRestantes: Number(r.dias_restantes),
      })),
      ...productoRows.map((r) => ({
        loteId: `producto-${r.producto_id}`,
        productoId: r.producto_id,
        productoNombre: r.producto_nombre,
        codigoLote: null,
        fechaVencimiento: r.fecha_vencimiento,
        cantidadActual: r.existencias,
        diasRestantes: Number(r.dias_restantes),
      })),
    ].sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));

    return {
      stockBajo: stockRows.map((r) => ({
        productoId: r.id,
        nombre: r.nombre,
        categoriaNombre: r.categoria_nombre,
        existencias: r.existencias,
        stockMinimo: r.stock_minimo,
      })),
      porVencer,
    };
  }
}
