import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { Cupon, NuevoCupon, ResultadoValidacionCupon } from '../domain/cupon.entity';
import { CuponesRepository } from '../domain/cupones.repository';
import { normalizarCodigoCupon } from '../../../shared/calculos';

const SELECT_CUPON = `SELECT id, codigo, porcentaje, activo FROM cupones`;

@Injectable()
export class CuponesRepositoryPg implements CuponesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(): Promise<Cupon[]> {
    const { rows } = await this.pool.query(`${SELECT_CUPON} ORDER BY created_at DESC`);
    return rows.map((r) => this.aCupon(r));
  }

  async crear(nuevo: NuevoCupon): Promise<Cupon> {
    const codigo = normalizarCodigoCupon(nuevo.codigo);
    if (codigo.length < 3) {
      throw new BadRequestException('El código debe tener al menos 3 caracteres.');
    }
    const { rows: existentes } = await this.pool.query(`SELECT id FROM cupones WHERE codigo = $1`, [
      codigo,
    ]);
    if (existentes.length > 0) {
      throw new BadRequestException(`Ya existe un cupón con el código "${codigo}".`);
    }
    const { rows } = await this.pool.query(
      `INSERT INTO cupones (codigo, porcentaje) VALUES ($1, $2)
       RETURNING id, codigo, porcentaje, activo`,
      [codigo, nuevo.porcentaje],
    );
    return this.aCupon(rows[0]);
  }

  async cambiarEstado(id: string, activo: boolean): Promise<Cupon> {
    const { rows } = await this.pool.query(
      `UPDATE cupones SET activo = $1 WHERE id = $2 RETURNING id, codigo, porcentaje, activo`,
      [activo, id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('El cupón no existe.');
    }
    return this.aCupon(rows[0]);
  }

  async eliminar(id: string): Promise<void> {
    const { rowCount } = await this.pool.query(`DELETE FROM cupones WHERE id = $1`, [id]);
    if (rowCount === 0) {
      throw new NotFoundException('El cupón no existe.');
    }
  }

  async validar(codigo: string): Promise<ResultadoValidacionCupon> {
    const codigoNormalizado = normalizarCodigoCupon(codigo);
    const { rows } = await this.pool.query(`${SELECT_CUPON} WHERE codigo = $1`, [
      codigoNormalizado,
    ]);
    if (rows.length === 0) {
      return { valido: false, porcentaje: null, mensaje: 'Ese código de cupón no existe.' };
    }
    const cupon = this.aCupon(rows[0]);
    if (!cupon.activo) {
      return { valido: false, porcentaje: null, mensaje: 'Ese cupón ya no está activo.' };
    }
    return { valido: true, porcentaje: cupon.porcentaje, mensaje: null };
  }

  private aCupon(row: Record<string, unknown>): Cupon {
    return {
      id: row.id as string,
      codigo: row.codigo as string,
      porcentaje: Number(row.porcentaje),
      activo: row.activo as boolean,
    };
  }
}
