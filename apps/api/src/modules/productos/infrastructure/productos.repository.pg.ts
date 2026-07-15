import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { CambiosProducto, NuevoProducto, Producto } from '../domain/producto.entity';
import { ProductosRepository } from '../domain/productos.repository';

const SELECT_BASE = `
  SELECT
    p.id, p.codigo_interno, p.codigo_barras, p.nombre, p.descripcion,
    p.precio_compra, p.costo_promedio, p.precio_venta, p.iva, p.unidad_medida, p.existencias,
    p.stock_minimo, p.vende_por_peso, p.favorito_pos, p.activo, p.ingredientes, p.info_nutricional, p.peso, p.peso_unidad,
    p.categoria_id, c.nombre AS categoria_nombre,
    p.marca_id, m.nombre AS marca_nombre,
    pi.url AS imagen_url,
    COALESCE(
      (SELECT json_agg(json_build_object('id', im.id, 'url', im.url, 'esPrincipal', im.es_principal)
                        ORDER BY im.orden, im.created_at)
       FROM producto_imagenes im WHERE im.producto_id = p.id),
      '[]'
    ) AS imagenes
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN marcas m ON m.id = p.marca_id
  LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id AND pi.es_principal = true
`;

const CAMPO_COLUMNA: Record<keyof CambiosProducto, string> = {
  codigoInterno: 'codigo_interno',
  codigoBarras: 'codigo_barras',
  nombre: 'nombre',
  descripcion: 'descripcion',
  precioCompra: 'precio_compra',
  precioVenta: 'precio_venta',
  iva: 'iva',
  categoriaId: 'categoria_id',
  marcaId: 'marca_id',
  unidadMedida: 'unidad_medida',
  existencias: 'existencias',
  stockMinimo: 'stock_minimo',
  vendePorPeso: 'vende_por_peso',
  ingredientes: 'ingredientes',
  infoNutricional: 'info_nutricional',
  peso: 'peso',
  pesoUnidad: 'peso_unidad',
};

const CAMPOS_JSON = new Set<keyof CambiosProducto>(['infoNutricional']);

function aProducto(row: QueryResultRow): Producto {
  return {
    id: row.id,
    codigoInterno: row.codigo_interno,
    codigoBarras: row.codigo_barras,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precioCompra: Number(row.precio_compra),
    costoPromedio: row.costo_promedio === null ? null : Number(row.costo_promedio),
    precioVenta: Number(row.precio_venta),
    iva: row.iva,
    categoriaId: row.categoria_id,
    categoriaNombre: row.categoria_nombre,
    marcaId: row.marca_id,
    marcaNombre: row.marca_nombre,
    unidadMedida: row.unidad_medida,
    existencias: row.existencias,
    stockMinimo: row.stock_minimo,
    vendePorPeso: row.vende_por_peso,
    favoritoPos: row.favorito_pos,
    imagenUrl: row.imagen_url,
    imagenes: row.imagenes ?? [],
    activo: row.activo,
    ingredientes: row.ingredientes,
    infoNutricional: row.info_nutricional,
    peso: row.peso === null ? null : Number(row.peso),
    pesoUnidad: row.peso_unidad,
  };
}

@Injectable()
export class ProductosRepositoryPg implements ProductosRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listar(incluirInactivos = false): Promise<Producto[]> {
    const where = incluirInactivos ? '' : 'WHERE p.activo = true';
    const { rows } = await this.pool.query(`${SELECT_BASE} ${where} ORDER BY p.nombre`);
    return rows.map(aProducto);
  }

  async buscar(termino: string): Promise<Producto[]> {
    const { rows } = await this.pool.query(
      `${SELECT_BASE}
        WHERE p.activo = true
        AND (
          unaccent_inmutable(p.nombre) ILIKE unaccent_inmutable('%' || $1 || '%')
          OR unaccent_inmutable(c.nombre) ILIKE unaccent_inmutable('%' || $1 || '%')
          OR unaccent_inmutable(coalesce(m.nombre, '')) ILIKE unaccent_inmutable('%' || $1 || '%')
          OR p.codigo_interno ILIKE '%' || $1 || '%'
          OR p.codigo_barras ILIKE '%' || $1 || '%'
        )
       ORDER BY p.nombre`,
      [termino],
    );
    return rows.map(aProducto);
  }

  async crear(nuevo: NuevoProducto): Promise<Producto> {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO productos
          (codigo_interno, codigo_barras, nombre, descripcion, precio_compra, costo_promedio, precio_venta,
           iva, categoria_id, marca_id, unidad_medida, existencias, stock_minimo, vende_por_peso,
           ingredientes, info_nutricional, peso, peso_unidad)
         VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [
          nuevo.codigoInterno,
          nuevo.codigoBarras ?? null,
          nuevo.nombre,
          nuevo.descripcion ?? null,
          nuevo.precioCompra,
          nuevo.precioVenta,
          nuevo.iva,
          nuevo.categoriaId,
          nuevo.marcaId ?? null,
          nuevo.unidadMedida,
          nuevo.existencias,
          nuevo.stockMinimo ?? 0,
          nuevo.vendePorPeso ?? false,
          nuevo.ingredientes ?? null,
          nuevo.infoNutricional ? JSON.stringify(nuevo.infoNutricional) : null,
          nuevo.peso ?? null,
          nuevo.pesoUnidad ?? null,
        ],
      );
      return this.obtenerPorId(rows[0].id);
    } catch (err) {
      throw this.errorAmigable(err);
    }
  }

  async actualizar(id: string, cambios: CambiosProducto): Promise<Producto> {
    const entradas = Object.entries(cambios).filter(([, v]) => v !== undefined) as [
      keyof CambiosProducto,
      unknown,
    ][];
    if (entradas.length === 0) {
      return this.obtenerPorId(id);
    }

    const set = entradas
      .map(([campo], i) => `${CAMPO_COLUMNA[campo]} = $${i + 2}`)
      .join(', ');
    const valores = entradas.map(([campo, v]) => (CAMPOS_JSON.has(campo) ? JSON.stringify(v) : v));

    try {
      const { rows } = await this.pool.query(
        `UPDATE productos SET ${set}, updated_at = now() WHERE id = $1 RETURNING id`,
        [id, ...valores],
      );
      if (rows.length === 0) {
        throw new NotFoundException('Producto no encontrado.');
      }
      return this.obtenerPorId(id);
    } catch (err) {
      throw this.errorAmigable(err);
    }
  }

  async cambiarEstado(id: string, activo: boolean): Promise<Producto> {
    const { rows } = await this.pool.query(
      `UPDATE productos SET activo = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [id, activo],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Producto no encontrado.');
    }
    return this.obtenerPorId(id);
  }

  async cambiarFavorito(id: string, favoritoPos: boolean): Promise<Producto> {
    const { rows } = await this.pool.query(
      `UPDATE productos SET favorito_pos = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [id, favoritoPos],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Producto no encontrado.');
    }
    return this.obtenerPorId(id);
  }

  async agregarImagen(id: string, url: string): Promise<Producto> {
    const { rows: existentes } = await this.pool.query(
      `SELECT count(*)::int AS n, coalesce(max(orden), -1) AS max_orden
       FROM producto_imagenes WHERE producto_id = $1`,
      [id],
    );
    const esPrimera = existentes[0].n === 0;
    await this.pool.query(
      `INSERT INTO producto_imagenes (producto_id, url, es_principal, orden)
       VALUES ($1, $2, $3, $4)`,
      [id, url, esPrimera, existentes[0].max_orden + 1],
    );
    return this.obtenerPorId(id);
  }

  async marcarImagenPrincipal(id: string, imagenId: string): Promise<Producto> {
    await this.pool.query(
      `UPDATE producto_imagenes SET es_principal = (id = $2) WHERE producto_id = $1`,
      [id, imagenId],
    );
    return this.obtenerPorId(id);
  }

  async eliminarImagen(id: string, imagenId: string): Promise<Producto> {
    const { rows: eliminada } = await this.pool.query(
      `DELETE FROM producto_imagenes WHERE id = $1 AND producto_id = $2 RETURNING es_principal`,
      [imagenId, id],
    );
    if (eliminada[0]?.es_principal) {
      await this.pool.query(
        `UPDATE producto_imagenes SET es_principal = true
         WHERE id = (SELECT id FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden LIMIT 1)`,
        [id],
      );
    }
    return this.obtenerPorId(id);
  }

  async duplicar(id: string, codigoInterno: string): Promise<Producto> {
    const original = await this.obtenerPorId(id);
    return this.crear({
      codigoInterno,
      nombre: `${original.nombre} (copia)`,
      descripcion: original.descripcion ?? undefined,
      precioCompra: original.precioCompra,
      precioVenta: original.precioVenta,
      iva: original.iva,
      categoriaId: original.categoriaId,
      marcaId: original.marcaId ?? undefined,
      unidadMedida: original.unidadMedida,
      existencias: 0,
      vendePorPeso: original.vendePorPeso,
      ingredientes: original.ingredientes ?? undefined,
      infoNutricional: original.infoNutricional ?? undefined,
      peso: original.peso ?? undefined,
      pesoUnidad: original.pesoUnidad ?? undefined,
    });
  }

  async eliminar(id: string): Promise<void> {
    let resultado;
    try {
      resultado = await this.pool.query(`DELETE FROM productos WHERE id = $1`, [id]);
    } catch (err) {
      const codigo = (err as { code?: string }).code;
      if (codigo === '23503') {
        throw new ConflictException(
          'Este producto ya tiene ventas, compras o movimientos de inventario registrados, así que no se puede eliminar definitivamente. Puedes desactivarlo en su lugar.',
        );
      }
      throw err;
    }
    if (resultado.rowCount === 0) {
      throw new NotFoundException('Producto no encontrado.');
    }
  }

  async obtenerPorId(id: string): Promise<Producto> {
    const { rows } = await this.pool.query(`${SELECT_BASE} WHERE p.id = $1`, [id]);
    if (rows.length === 0) {
      throw new NotFoundException('Producto no encontrado.');
    }
    return aProducto(rows[0]);
  }

  private errorAmigable(err: unknown) {
    const codigo = (err as { code?: string }).code;
    if (codigo === '23505') {
      return new ConflictException('Ya existe un producto con ese código interno o de barras.');
    }
    return err;
  }
}
