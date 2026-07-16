import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { CajaRepository } from '../domain/caja.repository';
import { CierreTurno, DenominacionConteo, NuevoTurno, TurnoCaja } from '../domain/turno.entity';
import { diferenciaCaja } from '../../../shared/calculos';

// Solo las ventas en efectivo mueven el cajón físico: tarjeta, transferencia,
// Nequi y Daviplata no cuentan para el arqueo. Una venta "mixta" no guarda
// hoy el desglose de cuánto fue efectivo, así que se deja fuera del cálculo
// para no sobrestimar lo que debería haber en la caja.
const SELECT_TURNO = `
  SELECT
    t.id, t.usuario_id, u.nombre AS usuario_nombre,
    t.abierto_en, t.cerrado_en, t.efectivo_inicial, t.efectivo_esperado,
    t.efectivo_contado, t.diferencia, t.notas, t.estado,
    COALESCE(SUM(v.valor), 0) AS total_ventas,
    COALESCE(SUM(v.valor) FILTER (WHERE v.metodo_pago = 'efectivo'), 0) AS total_efectivo,
    COUNT(v.id) AS cantidad_ventas
  FROM turnos_caja t
  JOIN usuarios u ON u.id = t.usuario_id
  LEFT JOIN ventas v ON v.turno_id = t.id
`;
const GROUP_BY_TURNO = ' GROUP BY t.id, u.nombre ';

@Injectable()
export class CajaRepositoryPg implements CajaRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async obtenerTurnoAbierto(): Promise<TurnoCaja | null> {
    const { rows } = await this.pool.query(
      `${SELECT_TURNO} WHERE t.estado = 'abierto' ${GROUP_BY_TURNO}`,
    );
    if (rows.length === 0) return null;
    return this.aTurno(rows[0]);
  }

  async abrir(turno: NuevoTurno): Promise<TurnoCaja> {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO turnos_caja (usuario_id, efectivo_inicial) VALUES ($1, $2) RETURNING id`,
        [turno.usuarioId, turno.efectivoInicial],
      );
      const { rows: turnoRows } = await this.pool.query(
        `${SELECT_TURNO} WHERE t.id = $1 ${GROUP_BY_TURNO}`,
        [rows[0].id],
      );
      return this.aTurno(turnoRows[0]);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException('Ya hay una caja abierta. Ciérrala antes de abrir una nueva.');
      }
      throw err;
    }
  }

  async cerrar(id: string, cierre: CierreTurno): Promise<TurnoCaja> {
    const { rows: actualRows } = await this.pool.query(
      `SELECT efectivo_inicial, estado FROM turnos_caja WHERE id = $1`,
      [id],
    );
    if (actualRows.length === 0) {
      throw new NotFoundException('El turno no existe.');
    }
    if (actualRows[0].estado === 'cerrado') {
      throw new BadRequestException('Este turno ya está cerrado.');
    }

    const { rows: sumaRows } = await this.pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_efectivo
       FROM ventas WHERE turno_id = $1 AND metodo_pago = 'efectivo'`,
      [id],
    );
    const efectivoEsperado =
      Number(actualRows[0].efectivo_inicial) + Number(sumaRows[0].total_efectivo);
    const diferencia = diferenciaCaja(cierre.efectivoContado, efectivoEsperado);

    await this.pool.query(
      `UPDATE turnos_caja
       SET estado = 'cerrado', cerrado_en = now(), efectivo_esperado = $1,
           efectivo_contado = $2, diferencia = $3, notas = $4
       WHERE id = $5`,
      [efectivoEsperado, cierre.efectivoContado, diferencia, cierre.notas ?? null, id],
    );

    if (cierre.denominaciones && cierre.denominaciones.length > 0) {
      for (const d of cierre.denominaciones) {
        if (d.cantidad <= 0) continue;
        await this.pool.query(
          `INSERT INTO turno_denominaciones (turno_id, denominacion, cantidad) VALUES ($1, $2, $3)`,
          [id, d.denominacion, d.cantidad],
        );
      }
    }

    const { rows: turnoRows } = await this.pool.query(
      `${SELECT_TURNO} WHERE t.id = $1 ${GROUP_BY_TURNO}`,
      [id],
    );
    return this.aTurno(turnoRows[0]);
  }

  async listar(): Promise<TurnoCaja[]> {
    const { rows } = await this.pool.query(`${SELECT_TURNO} ${GROUP_BY_TURNO} ORDER BY t.abierto_en DESC`);
    return rows.map((r) => this.aTurno(r));
  }

  async obtenerDenominaciones(turnoId: string): Promise<DenominacionConteo[]> {
    const { rows } = await this.pool.query(
      `SELECT denominacion, cantidad FROM turno_denominaciones
       WHERE turno_id = $1 ORDER BY denominacion DESC`,
      [turnoId],
    );
    return rows.map((r) => ({ denominacion: Number(r.denominacion), cantidad: Number(r.cantidad) }));
  }

  private aTurno(row: Record<string, unknown>): TurnoCaja {
    return {
      id: row.id as string,
      usuarioId: row.usuario_id as string,
      usuarioNombre: row.usuario_nombre as string,
      abiertoEn: (row.abierto_en as Date).toISOString(),
      cerradoEn: row.cerrado_en ? (row.cerrado_en as Date).toISOString() : null,
      efectivoInicial: Number(row.efectivo_inicial),
      efectivoEsperado: row.efectivo_esperado === null ? null : Number(row.efectivo_esperado),
      efectivoContado: row.efectivo_contado === null ? null : Number(row.efectivo_contado),
      diferencia: row.diferencia === null ? null : Number(row.diferencia),
      notas: (row.notas as string) ?? null,
      estado: row.estado as TurnoCaja['estado'],
      totalVentas: Number(row.total_ventas),
      totalEfectivo: Number(row.total_efectivo),
      cantidadVentas: Number(row.cantidad_ventas),
    };
  }
}
