import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { CambiosNegocio, Negocio } from '../domain/negocio.entity';
import { NegocioRepository } from '../domain/negocio.repository';

const CAMPO_COLUMNA: Record<keyof CambiosNegocio, string> = {
  nombre: 'nombre',
  nit: 'nit',
  direccion: 'direccion',
  telefono: 'telefono',
};

@Injectable()
export class NegocioRepositoryPg implements NegocioRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async obtener(): Promise<Negocio | null> {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, nit, direccion, telefono FROM negocio LIMIT 1`,
    );
    if (rows.length === 0) return null;
    return this.aNegocio(rows[0]);
  }

  async actualizar(cambios: CambiosNegocio): Promise<Negocio> {
    const entradas = Object.entries(cambios).filter(([, v]) => v !== undefined) as [
      keyof CambiosNegocio,
      string,
    ][];
    if (entradas.length === 0) {
      const actual = await this.obtener();
      if (!actual) throw new NotFoundException('No hay datos del negocio para editar.');
      return actual;
    }

    const set = entradas.map(([campo], i) => `${CAMPO_COLUMNA[campo]} = $${i + 1}`).join(', ');
    const valores = entradas.map(([, v]) => v);

    const { rows } = await this.pool.query(
      `UPDATE negocio SET ${set}, updated_at = now()
       WHERE id = (SELECT id FROM negocio LIMIT 1)
       RETURNING id, nombre, nit, direccion, telefono`,
      valores,
    );
    if (rows.length === 0) {
      throw new NotFoundException('No hay datos del negocio para editar.');
    }
    return this.aNegocio(rows[0]);
  }

  private aNegocio(row: { id: string; nombre: string; nit: string; direccion: string | null; telefono: string | null }): Negocio {
    return {
      id: row.id,
      nombre: row.nombre,
      nit: row.nit,
      direccion: row.direccion,
      telefono: row.telefono,
    };
  }
}
