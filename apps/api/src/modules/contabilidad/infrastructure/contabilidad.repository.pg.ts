import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import {
  EstadoResultados,
  FlujoCaja,
  Gasto,
  NuevoGasto,
} from '../domain/gasto.entity';
import { ContabilidadRepository } from '../domain/contabilidad.repository';

function aGasto(row: Record<string, unknown>): Gasto {
  return {
    id: row.id as string,
    fecha: row.fecha as string,
    categoria: row.categoria as string,
    descripcion: (row.descripcion as string) ?? null,
    valor: Number(row.valor),
    metodoPago: row.metodo_pago as Gasto['metodoPago'],
  };
}

@Injectable()
export class ContabilidadRepositoryPg implements ContabilidadRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listarGastos(desde?: string, hasta?: string): Promise<Gasto[]> {
    const condiciones: string[] = [];
    const valores: string[] = [];
    if (desde) {
      valores.push(desde);
      condiciones.push(`fecha >= $${valores.length}`);
    }
    if (hasta) {
      valores.push(hasta);
      condiciones.push(`fecha <= $${valores.length}`);
    }
    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const { rows } = await this.pool.query(
      `SELECT id, to_char(fecha, 'YYYY-MM-DD') AS fecha, categoria, descripcion, valor, metodo_pago
       FROM gastos ${where}
       ORDER BY fecha DESC, created_at DESC`,
      valores,
    );
    return rows.map(aGasto);
  }

  async crearGasto(nuevo: NuevoGasto): Promise<Gasto> {
    const { rows } = await this.pool.query(
      `INSERT INTO gastos (fecha, categoria, descripcion, valor, metodo_pago, registrado_por)
       VALUES (COALESCE($1, current_date), $2, $3, $4, $5, $6)
       RETURNING id, to_char(fecha, 'YYYY-MM-DD') AS fecha, categoria, descripcion, valor, metodo_pago`,
      [
        nuevo.fecha ?? null,
        nuevo.categoria,
        nuevo.descripcion ?? null,
        nuevo.valor,
        nuevo.metodoPago,
        nuevo.registradoPor,
      ],
    );
    return aGasto(rows[0]);
  }

  async eliminarGasto(id: string): Promise<void> {
    const { rowCount } = await this.pool.query(`DELETE FROM gastos WHERE id = $1`, [id]);
    if (rowCount === 0) {
      throw new NotFoundException('El gasto no existe o ya fue eliminado.');
    }
  }

  async obtenerFlujoCaja(desde: string, hasta: string): Promise<FlujoCaja> {
    const { rows: ventasRows } = await this.pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM ventas WHERE fecha BETWEEN $1 AND $2`,
      [desde, hasta],
    );
    const { rows: gastosRows } = await this.pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM gastos WHERE fecha BETWEEN $1 AND $2`,
      [desde, hasta],
    );
    const { rows: comprasRows } = await this.pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM compras
       WHERE fecha BETWEEN $1 AND $2 AND pagado = true`,
      [desde, hasta],
    );

    const ingresosVentas = Number(ventasRows[0].total);
    const gastos = Number(gastosRows[0].total);
    const comprasPagadas = Number(comprasRows[0].total);

    return {
      desde,
      hasta,
      ingresosVentas,
      gastos,
      comprasPagadas,
      flujoNeto: ingresosVentas - gastos - comprasPagadas,
    };
  }

  async obtenerEstadoResultados(desde: string, hasta: string): Promise<EstadoResultados> {
    const { rows: ventasRows } = await this.pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM ventas WHERE fecha BETWEEN $1 AND $2`,
      [desde, hasta],
    );
    const { rows: costoRows } = await this.pool.query(
      `SELECT COALESCE(SUM(cantidad * -1 * COALESCE(costo_unitario, 0)), 0) AS total
       FROM movimientos_inventario
       WHERE tipo = 'salida' AND referencia_tipo = 'venta'
         AND created_at::date BETWEEN $1 AND $2`,
      [desde, hasta],
    );
    const { rows: gastosRows } = await this.pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM gastos WHERE fecha BETWEEN $1 AND $2`,
      [desde, hasta],
    );

    const ingresos = Number(ventasRows[0].total);
    const costoVentas = Number(costoRows[0].total);
    const gastosOperativos = Number(gastosRows[0].total);
    const utilidadBruta = ingresos - costoVentas;

    return {
      desde,
      hasta,
      ingresos,
      costoVentas,
      utilidadBruta,
      gastosOperativos,
      utilidadNeta: utilidadBruta - gastosOperativos,
    };
  }
}
