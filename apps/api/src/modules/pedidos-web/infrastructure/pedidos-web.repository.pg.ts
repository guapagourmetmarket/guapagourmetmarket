import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../database/database.module';
import { EstadoPedidoWeb, NuevoPedidoWeb, PedidoWeb } from '../domain/pedido-web.entity';
import { PedidosWebRepository } from '../domain/pedidos-web.repository';
import { subtotalConPromocion } from '../../../shared/calculos';

const SELECT_PEDIDO_WEB = `
  SELECT
    p.id, p.numero, p.cliente_nombre, p.cliente_telefono, p.notas, p.valor,
    p.descuento, p.cupon_codigo, p.estado, p.created_at,
    COALESCE(
      (SELECT json_agg(json_build_object(
                'id', i.id,
                'productoId', i.producto_id,
                'nombreProducto', i.nombre_producto,
                'cantidad', i.cantidad,
                'precioUnitario', i.precio_unitario,
                'subtotal', i.subtotal
              ) ORDER BY i.id)
       FROM pedido_web_items i WHERE i.pedido_web_id = p.id),
      '[]'
    ) AS items
  FROM pedidos_web p
`;

function aPedidoWeb(row: {
  id: string;
  numero: string | number;
  cliente_nombre: string;
  cliente_telefono: string;
  notas: string | null;
  valor: string | number;
  descuento: string | number | null;
  cupon_codigo: string | null;
  estado: EstadoPedidoWeb;
  created_at: Date;
  items: {
    id: string;
    productoId: string | null;
    nombreProducto: string;
    cantidad: string | number;
    precioUnitario: string | number;
    subtotal: string | number;
  }[];
}): PedidoWeb {
  return {
    id: row.id,
    numero: Number(row.numero),
    clienteNombre: row.cliente_nombre,
    clienteTelefono: row.cliente_telefono,
    notas: row.notas,
    valor: Number(row.valor),
    descuento: Number(row.descuento ?? 0),
    cuponCodigo: row.cupon_codigo,
    estado: row.estado,
    createdAt: row.created_at.toISOString(),
    items: row.items.map((i) => ({
      id: i.id,
      productoId: i.productoId,
      nombreProducto: i.nombreProducto,
      cantidad: Number(i.cantidad),
      precioUnitario: Number(i.precioUnitario),
      subtotal: Number(i.subtotal),
    })),
  };
}

@Injectable()
export class PedidosWebRepositoryPg implements PedidosWebRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async crear(nuevo: NuevoPedidoWeb): Promise<PedidoWeb> {
    if (nuevo.items.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos un producto.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const itemsConDatos: {
        productoId: string;
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }[] = [];

      for (const item of nuevo.items) {
        const { rows } = await client.query(
          `SELECT nombre, precio_venta, descuento_porcentaje, promocion_n, promocion_m, activo
           FROM productos WHERE id = $1`,
          [item.productoId],
        );
        if (rows.length === 0 || !rows[0].activo) {
          throw new BadRequestException('Uno de los productos del pedido ya no está disponible.');
        }
        const producto = rows[0];
        // Igual que en una venta normal: si el producto tiene una oferta
        // activa (% descuento o lleva N paga M), el pre-pedido se cotiza ya
        // con la promoción aplicada.
        const precioLista = Number(producto.precio_venta);
        const subtotal = subtotalConPromocion(precioLista, item.cantidad, {
          descuentoPorcentaje: producto.descuento_porcentaje === null ? null : Number(producto.descuento_porcentaje),
          promocionN: producto.promocion_n === null ? null : Number(producto.promocion_n),
          promocionM: producto.promocion_m === null ? null : Number(producto.promocion_m),
        });
        const precioUnitario = item.cantidad > 0 ? Math.round(subtotal / item.cantidad) : precioLista;
        itemsConDatos.push({
          productoId: item.productoId,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario,
          subtotal,
        });
      }

      const subtotal = itemsConDatos.reduce((acc, i) => acc + i.subtotal, 0);
      const descuento = Math.round(subtotal * ((nuevo.descuentoPorcentaje ?? 0) / 100));
      const valor = subtotal - descuento;

      const { rows: pedidoRows } = await client.query(
        `INSERT INTO pedidos_web (cliente_nombre, cliente_telefono, notas, valor, descuento, cupon_codigo)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, numero, cliente_nombre, cliente_telefono, notas, valor, descuento, cupon_codigo,
                   estado, created_at`,
        [
          nuevo.clienteNombre,
          nuevo.clienteTelefono,
          nuevo.notas ?? null,
          valor,
          descuento,
          nuevo.cuponCodigo ?? null,
        ],
      );
      const pedido = pedidoRows[0];

      const items: PedidoWeb['items'] = [];
      for (const item of itemsConDatos) {
        const { rows: itemRows } = await client.query(
          `INSERT INTO pedido_web_items (pedido_web_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [pedido.id, item.productoId, item.nombre, item.cantidad, item.precioUnitario, item.subtotal],
        );
        items.push({
          id: itemRows[0].id,
          productoId: item.productoId,
          nombreProducto: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        });
      }

      await client.query('COMMIT');

      return {
        id: pedido.id,
        numero: Number(pedido.numero),
        clienteNombre: pedido.cliente_nombre,
        clienteTelefono: pedido.cliente_telefono,
        notas: pedido.notas,
        valor: Number(pedido.valor),
        descuento: Number(pedido.descuento ?? 0),
        cuponCodigo: pedido.cupon_codigo,
        estado: pedido.estado,
        createdAt: pedido.created_at.toISOString(),
        items,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listar(): Promise<PedidoWeb[]> {
    const { rows } = await this.pool.query(`${SELECT_PEDIDO_WEB} ORDER BY p.created_at DESC`);
    return rows.map(aPedidoWeb);
  }

  async cambiarEstado(id: string, estado: EstadoPedidoWeb): Promise<PedidoWeb> {
    const { rows } = await this.pool.query(
      `UPDATE pedidos_web SET estado = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [id, estado],
    );
    if (rows.length === 0) throw new NotFoundException('Pedido no encontrado.');
    const { rows: full } = await this.pool.query(`${SELECT_PEDIDO_WEB} WHERE p.id = $1`, [id]);
    return aPedidoWeb(full[0]);
  }
}
