import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import {
  MargenProducto,
  ProductoVendido,
  ResumenDashboard,
  VentaPorCategoria,
  VentaPorDia,
  VentaPorEmpleado,
} from '../domain/reporte.entity';
import { ReportesRepository } from '../domain/reportes.repository';

@Injectable()
export class ReportesRepositoryPg implements ReportesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async obtenerResumen(): Promise<ResumenDashboard> {
    const { rows } = await this.pool.query(
      `SELECT
        COALESCE(SUM(valor) FILTER (WHERE fecha = current_date), 0) AS ventas_hoy,
        COUNT(*) FILTER (WHERE fecha = current_date) AS cantidad_hoy,
        COALESCE(SUM(valor) FILTER (WHERE fecha >= date_trunc('month', current_date)), 0) AS ventas_mes,
        COUNT(*) FILTER (WHERE fecha >= date_trunc('month', current_date)) AS cantidad_mes
       FROM ventas`,
    );
    const r = rows[0];
    return {
      ventasHoy: Number(r.ventas_hoy),
      ventasMes: Number(r.ventas_mes),
      cantidadVentasHoy: Number(r.cantidad_hoy),
      cantidadVentasMes: Number(r.cantidad_mes),
    };
  }

  async ventasPorDia(desde: string, hasta: string): Promise<VentaPorDia[]> {
    const { rows } = await this.pool.query(
      `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, SUM(valor) AS total, COUNT(*) AS cantidad
       FROM ventas
       WHERE fecha BETWEEN $1 AND $2
       GROUP BY fecha
       ORDER BY fecha ASC`,
      [desde, hasta],
    );
    return rows.map((r) => ({
      fecha: r.fecha,
      total: Number(r.total),
      cantidadVentas: Number(r.cantidad),
    }));
  }

  async topProductos(
    desde: string,
    hasta: string,
    orden: 'mas' | 'menos',
    limite: number,
  ): Promise<ProductoVendido[]> {
    const { rows } = await this.pool.query(
      `SELECT vi.producto_id, vi.nombre_producto,
              SUM(vi.cantidad) AS cantidad_vendida, SUM(vi.subtotal) AS total_vendido
       FROM venta_items vi
       JOIN ventas v ON v.id = vi.venta_id
       WHERE v.fecha BETWEEN $1 AND $2
       GROUP BY vi.producto_id, vi.nombre_producto
       ORDER BY cantidad_vendida ${orden === 'mas' ? 'DESC' : 'ASC'}
       LIMIT $3`,
      [desde, hasta, limite],
    );
    return rows.map((r) => ({
      productoId: r.producto_id,
      nombre: r.nombre_producto,
      cantidadVendida: Number(r.cantidad_vendida),
      totalVendido: Number(r.total_vendido),
    }));
  }

  async ventasPorCategoria(desde: string, hasta: string): Promise<VentaPorCategoria[]> {
    const { rows } = await this.pool.query(
      `SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria, SUM(vi.subtotal) AS total
       FROM venta_items vi
       JOIN ventas v ON v.id = vi.venta_id
       LEFT JOIN productos p ON p.id = vi.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE v.fecha BETWEEN $1 AND $2
       GROUP BY c.nombre
       ORDER BY total DESC`,
      [desde, hasta],
    );
    return rows.map((r) => ({ categoria: r.categoria, total: Number(r.total) }));
  }

  async ventasPorEmpleado(desde: string, hasta: string): Promise<VentaPorEmpleado[]> {
    const { rows } = await this.pool.query(
      `SELECT u.id AS usuario_id, COALESCE(u.nombre, 'Sin usuario') AS usuario,
              SUM(v.valor) AS total, COUNT(*) AS cantidad
       FROM ventas v
       LEFT JOIN usuarios u ON u.id = v.registrado_por
       WHERE v.fecha BETWEEN $1 AND $2
       GROUP BY u.id, u.nombre
       ORDER BY total DESC`,
      [desde, hasta],
    );
    return rows.map((r) => ({
      usuarioId: r.usuario_id ?? null,
      usuario: r.usuario,
      total: Number(r.total),
      cantidadVentas: Number(r.cantidad),
    }));
  }

  async margenProductos(desde: string, hasta: string, limite: number): Promise<MargenProducto[]> {
    const { rows } = await this.pool.query(
      `SELECT mi.producto_id, vi.nombre_producto,
              SUM(vi.subtotal) AS ingresos,
              SUM((-mi.cantidad) * COALESCE(mi.costo_unitario, 0)) AS costo
       FROM movimientos_inventario mi
       JOIN venta_items vi ON vi.venta_id = mi.referencia_id AND vi.producto_id = mi.producto_id
       JOIN ventas v ON v.id = mi.referencia_id
       WHERE mi.tipo = 'salida' AND mi.referencia_tipo = 'venta'
         AND v.fecha BETWEEN $1 AND $2
       GROUP BY mi.producto_id, vi.nombre_producto
       ORDER BY (SUM(vi.subtotal) - SUM((-mi.cantidad) * COALESCE(mi.costo_unitario, 0))) DESC
       LIMIT $3`,
      [desde, hasta, limite],
    );
    return rows.map((r) => {
      const ingresos = Number(r.ingresos);
      const costo = Number(r.costo);
      const margen = ingresos - costo;
      return {
        productoId: r.producto_id,
        nombre: r.nombre_producto,
        ingresos,
        costo,
        margen,
        porcentajeMargen: ingresos > 0 ? Math.round((margen / ingresos) * 1000) / 10 : 0,
      };
    });
  }
}
