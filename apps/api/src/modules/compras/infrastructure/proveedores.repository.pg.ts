import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { CambiosProveedor, NuevoProveedor, Proveedor } from '../domain/proveedor.entity';
import { ProveedoresRepository } from '../domain/proveedores.repository';

const SELECT_BASE = `
  SELECT id, nombre, nit, telefono, email, direccion, condiciones_pago, activo
  FROM proveedores
`;

const CAMPO_COLUMNA: Record<keyof CambiosProveedor, string> = {
  nombre: 'nombre',
  nit: 'nit',
  telefono: 'telefono',
  email: 'email',
  direccion: 'direccion',
  condicionesPago: 'condiciones_pago',
};

function aProveedor(row: QueryResultRow): Proveedor {
  return {
    id: row.id,
    nombre: row.nombre,
    nit: row.nit,
    telefono: row.telefono,
    email: row.email,
    direccion: row.direccion,
    condicionesPago: row.condiciones_pago,
    activo: row.activo,
  };
}

@Injectable()
export class ProveedoresRepositoryPg implements ProveedoresRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(incluirInactivos = false): Promise<Proveedor[]> {
    const where = incluirInactivos ? '' : 'WHERE activo = true';
    const { rows } = await this.pool.query(`${SELECT_BASE} ${where} ORDER BY nombre`);
    return rows.map(aProveedor);
  }

  async obtenerPorId(id: string): Promise<Proveedor> {
    const { rows } = await this.pool.query(`${SELECT_BASE} WHERE id = $1`, [id]);
    if (rows.length === 0) {
      throw new NotFoundException('Proveedor no encontrado.');
    }
    return aProveedor(rows[0]);
  }

  async crear(nuevo: NuevoProveedor): Promise<Proveedor> {
    const { rows } = await this.pool.query(
      `INSERT INTO proveedores (nombre, nit, telefono, email, direccion, condiciones_pago)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, nombre, nit, telefono, email, direccion, condiciones_pago, activo`,
      [
        nuevo.nombre,
        nuevo.nit ?? null,
        nuevo.telefono ?? null,
        nuevo.email ?? null,
        nuevo.direccion ?? null,
        nuevo.condicionesPago ?? null,
      ],
    );
    return aProveedor(rows[0]);
  }

  async actualizar(id: string, cambios: CambiosProveedor): Promise<Proveedor> {
    const entradas = Object.entries(cambios).filter(([, v]) => v !== undefined) as [
      keyof CambiosProveedor,
      string,
    ][];
    if (entradas.length === 0) {
      return this.obtenerPorId(id);
    }
    const set = entradas.map(([campo], i) => `${CAMPO_COLUMNA[campo]} = $${i + 2}`).join(', ');
    const valores = entradas.map(([, v]) => v);

    const { rows } = await this.pool.query(
      `UPDATE proveedores SET ${set}, updated_at = now() WHERE id = $1 RETURNING id`,
      [id, ...valores],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Proveedor no encontrado.');
    }
    return this.obtenerPorId(id);
  }

  async cambiarEstado(id: string, activo: boolean): Promise<Proveedor> {
    const { rows } = await this.pool.query(
      `UPDATE proveedores SET activo = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [id, activo],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Proveedor no encontrado.');
    }
    return this.obtenerPorId(id);
  }
}
