import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import {
  CambiosPedidoEncargo,
  EstadoPedidoEncargo,
  NuevoPedidoEncargo,
  PedidoEncargo,
} from '../domain/pedido-encargo.entity';
import { PedidosRepository } from '../domain/pedidos.repository';

const SELECT_PEDIDO = `
  SELECT id, cliente_nombre, cliente_telefono, descripcion,
         to_char(fecha_entrega, 'YYYY-MM-DD') AS fecha_entrega,
         valor, anticipo, estado, notas, created_at
  FROM pedidos_encargo
`;

@Injectable()
export class PedidosRepositoryPg implements PedidosRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(): Promise<PedidoEncargo[]> {
    const { rows } = await this.pool.query(
      `${SELECT_PEDIDO} ORDER BY fecha_entrega ASC, created_at ASC`,
    );
    return rows.map((r) => this.aPedido(r));
  }

  async crear(nuevo: NuevoPedidoEncargo): Promise<PedidoEncargo> {
    const { rows } = await this.pool.query(
      `INSERT INTO pedidos_encargo
        (cliente_nombre, cliente_telefono, descripcion, fecha_entrega, valor, anticipo, notas, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, cliente_nombre, cliente_telefono, descripcion,
                 to_char(fecha_entrega, 'YYYY-MM-DD') AS fecha_entrega,
                 valor, anticipo, estado, notas, created_at`,
      [
        nuevo.clienteNombre,
        nuevo.clienteTelefono ?? null,
        nuevo.descripcion,
        nuevo.fechaEntrega,
        nuevo.valor ?? null,
        nuevo.anticipo ?? 0,
        nuevo.notas ?? null,
        nuevo.registradoPor,
      ],
    );
    return this.aPedido(rows[0]);
  }

  async actualizar(id: string, cambios: CambiosPedidoEncargo): Promise<PedidoEncargo> {
    const actual = await this.obtener(id);
    const { rows } = await this.pool.query(
      `UPDATE pedidos_encargo SET
        cliente_nombre = $1, cliente_telefono = $2, descripcion = $3, fecha_entrega = $4,
        valor = $5, anticipo = $6, notas = $7, updated_at = now()
       WHERE id = $8
       RETURNING id, cliente_nombre, cliente_telefono, descripcion,
                 to_char(fecha_entrega, 'YYYY-MM-DD') AS fecha_entrega,
                 valor, anticipo, estado, notas, created_at`,
      [
        cambios.clienteNombre ?? actual.clienteNombre,
        cambios.clienteTelefono !== undefined ? cambios.clienteTelefono : actual.clienteTelefono,
        cambios.descripcion ?? actual.descripcion,
        cambios.fechaEntrega ?? actual.fechaEntrega,
        cambios.valor !== undefined ? cambios.valor : actual.valor,
        cambios.anticipo ?? actual.anticipo,
        cambios.notas !== undefined ? cambios.notas : actual.notas,
        id,
      ],
    );
    return this.aPedido(rows[0]);
  }

  async cambiarEstado(id: string, estado: EstadoPedidoEncargo): Promise<PedidoEncargo> {
    const { rows } = await this.pool.query(
      `UPDATE pedidos_encargo SET estado = $1, updated_at = now() WHERE id = $2
       RETURNING id, cliente_nombre, cliente_telefono, descripcion,
                 to_char(fecha_entrega, 'YYYY-MM-DD') AS fecha_entrega,
                 valor, anticipo, estado, notas, created_at`,
      [estado, id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('El pedido no existe.');
    }
    return this.aPedido(rows[0]);
  }

  async eliminar(id: string): Promise<void> {
    const { rowCount } = await this.pool.query(`DELETE FROM pedidos_encargo WHERE id = $1`, [id]);
    if (rowCount === 0) {
      throw new NotFoundException('El pedido no existe.');
    }
  }

  private async obtener(id: string): Promise<PedidoEncargo> {
    const { rows } = await this.pool.query(`${SELECT_PEDIDO} WHERE id = $1`, [id]);
    if (rows.length === 0) {
      throw new NotFoundException('El pedido no existe.');
    }
    return this.aPedido(rows[0]);
  }

  private aPedido(row: Record<string, unknown>): PedidoEncargo {
    return {
      id: row.id as string,
      clienteNombre: row.cliente_nombre as string,
      clienteTelefono: (row.cliente_telefono as string) ?? null,
      descripcion: row.descripcion as string,
      fechaEntrega: row.fecha_entrega as string,
      valor: row.valor === null ? null : Number(row.valor),
      anticipo: Number(row.anticipo),
      estado: row.estado as EstadoPedidoEncargo,
      notas: (row.notas as string) ?? null,
      createdAt: (row.created_at as Date).toISOString(),
    };
  }
}
