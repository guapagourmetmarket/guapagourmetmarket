import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { Usuario } from '../domain/usuario.entity';
import { CambiosCredenciales, UsuariosRepository } from '../domain/usuarios.repository';

function aUsuario(row: Record<string, unknown>): Usuario {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    rol: row.rol as Usuario['rol'],
    activo: row.activo as boolean,
  };
}

@Injectable()
export class UsuariosRepositoryPg implements UsuariosRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1`,
      [email],
    );
    return rows.length === 0 ? null : aUsuario(rows[0]);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE id = $1`,
      [id],
    );
    return rows.length === 0 ? null : aUsuario(rows[0]);
  }

  async actualizarCredenciales(id: string, cambios: CambiosCredenciales): Promise<Usuario> {
    try {
      const { rows } = await this.pool.query(
        `UPDATE usuarios SET
           email = COALESCE($1, email),
           password_hash = COALESCE($2, password_hash),
           updated_at = now()
         WHERE id = $3
         RETURNING id, nombre, email, password_hash, rol, activo`,
        [cambios.email ?? null, cambios.passwordHash ?? null, id],
      );
      if (rows.length === 0) {
        throw new NotFoundException('Usuario no encontrado.');
      }
      return aUsuario(rows[0]);
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
        throw new BadRequestException(`Ya existe una cuenta con el correo "${cambios.email}".`);
      }
      throw err;
    }
  }
}
