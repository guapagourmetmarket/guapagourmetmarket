import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { EntradaAuditoria, RegistroAuditoria } from '../domain/auditoria.entity';
import { AuditoriaRepository } from '../domain/auditoria.repository';

@Injectable()
export class AuditoriaRepositoryPg implements AuditoriaRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async registrar(entrada: EntradaAuditoria): Promise<void> {
    await this.pool.query(
      `INSERT INTO auditoria (usuario_id, accion, entidad_tipo, entidad_id, detalle)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entrada.usuarioId,
        entrada.accion,
        entrada.entidadTipo,
        entrada.entidadId ?? null,
        entrada.detalle ?? null,
      ],
    );
  }

  async listar(limite: number): Promise<RegistroAuditoria[]> {
    const { rows } = await this.pool.query(
      `SELECT a.id, a.usuario_id, u.nombre AS usuario_nombre, a.accion, a.entidad_tipo,
              a.entidad_id, a.detalle, a.created_at
       FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limite],
    );
    return rows.map((r) => ({
      id: r.id as string,
      usuarioId: (r.usuario_id as string) ?? null,
      usuarioNombre: (r.usuario_nombre as string) ?? null,
      accion: r.accion as string,
      entidadTipo: r.entidad_tipo as string,
      entidadId: (r.entidad_id as string) ?? null,
      detalle: (r.detalle as string) ?? null,
      createdAt: (r.created_at as Date).toISOString(),
    }));
  }
}
