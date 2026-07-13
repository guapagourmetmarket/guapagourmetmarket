import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { Categoria } from '../domain/categoria.entity';
import { CategoriasRepository } from '../domain/categorias.repository';

const SIN_CATEGORIA = 'Sin categoría';

@Injectable()
export class CategoriasRepositoryPg implements CategoriasRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(): Promise<Categoria[]> {
    const { rows } = await this.pool.query(
      `SELECT id, nombre FROM categorias ORDER BY nombre`,
    );
    return rows;
  }

  async obtenerOCrear(nombre: string): Promise<Categoria> {
    const { rows } = await this.pool.query(
      `INSERT INTO categorias (nombre) VALUES ($1)
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id, nombre`,
      [nombre.trim()],
    );
    return rows[0];
  }

  async renombrar(id: string, nombre: string): Promise<Categoria> {
    try {
      const { rows } = await this.pool.query(
        `UPDATE categorias SET nombre = $1 WHERE id = $2 RETURNING id, nombre`,
        [nombre.trim(), id],
      );
      if (rows.length === 0) {
        throw new NotFoundException('Categoría no encontrada.');
      }
      return rows[0];
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
        throw new BadRequestException(`Ya existe una categoría llamada "${nombre.trim()}".`);
      }
      throw err;
    }
  }

  async eliminar(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(`SELECT nombre FROM categorias WHERE id = $1 FOR UPDATE`, [id]);
      if (rows.length === 0) {
        throw new NotFoundException('Categoría no encontrada.');
      }
      if (rows[0].nombre === SIN_CATEGORIA) {
        throw new BadRequestException(`No se puede eliminar la categoría "${SIN_CATEGORIA}".`);
      }

      const { rows: destinoRows } = await client.query(
        `INSERT INTO categorias (nombre) VALUES ($1)
         ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
         RETURNING id`,
        [SIN_CATEGORIA],
      );
      await client.query(`UPDATE productos SET categoria_id = $1 WHERE categoria_id = $2`, [
        destinoRows[0].id,
        id,
      ]);
      await client.query(`DELETE FROM categorias WHERE id = $1`, [id]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
