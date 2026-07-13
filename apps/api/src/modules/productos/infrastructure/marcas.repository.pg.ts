import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { Marca } from '../domain/marca.entity';
import { MarcasRepository } from '../domain/marcas.repository';

@Injectable()
export class MarcasRepositoryPg implements MarcasRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(): Promise<Marca[]> {
    const { rows } = await this.pool.query(`SELECT id, nombre FROM marcas ORDER BY nombre`);
    return rows;
  }

  async obtenerOCrear(nombre: string): Promise<Marca> {
    const { rows } = await this.pool.query(
      `INSERT INTO marcas (nombre) VALUES ($1)
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id, nombre`,
      [nombre.trim()],
    );
    return rows[0];
  }

  async renombrar(id: string, nombre: string): Promise<Marca> {
    try {
      const { rows } = await this.pool.query(
        `UPDATE marcas SET nombre = $1 WHERE id = $2 RETURNING id, nombre`,
        [nombre.trim(), id],
      );
      if (rows.length === 0) {
        throw new NotFoundException('Marca no encontrada.');
      }
      return rows[0];
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
        throw new BadRequestException(`Ya existe una marca llamada "${nombre.trim()}".`);
      }
      throw err;
    }
  }

  async eliminar(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rowCount } = await client.query(`SELECT id FROM marcas WHERE id = $1 FOR UPDATE`, [id]);
      if (rowCount === 0) {
        throw new NotFoundException('Marca no encontrada.');
      }

      await client.query(`UPDATE productos SET marca_id = NULL WHERE marca_id = $1`, [id]);
      await client.query(`DELETE FROM marcas WHERE id = $1`, [id]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
