import Dexie, { type Table } from 'dexie'
import type { Producto } from '@guapa/shared'
import type { NuevaVenta } from './api'

export interface VentaPendiente {
  id: string
  payload: NuevaVenta
  creadoEn: string
  error?: string
}

class GuapaDB extends Dexie {
  productos!: Table<Producto, string>
  outboxVentas!: Table<VentaPendiente, string>

  constructor() {
    super('guapa-gourmet')
    this.version(1).stores({
      productos: 'id, nombre, codigoBarras, codigoInterno',
      outboxVentas: 'id, creadoEn',
    })
  }
}

export const db = new GuapaDB()

export async function cachearProductos(productos: Producto[]) {
  await db.productos.bulkPut(productos)
}

export async function obtenerProductosCache(incluirInactivos = false): Promise<Producto[]> {
  const productos = await db.productos.toArray()
  return incluirInactivos ? productos : productos.filter((p) => p.activo !== false)
}

export async function buscarProductosCache(q: string): Promise<Producto[]> {
  const termino = q.trim().toLowerCase()
  if (!termino) return []
  const productos = await db.productos.toArray()
  return productos
    .filter((p) => p.activo !== false)
    .filter((p) =>
      [p.nombre, p.categoriaNombre, p.marcaNombre, p.codigoInterno, p.codigoBarras]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termino)),
    )
}

/** Descuenta existencias en la caché local para que la siguiente venta offline vea el stock real. */
export async function descontarStockCache(items: { productoId: string; cantidad: number }[]) {
  await db.transaction('rw', db.productos, async () => {
    for (const item of items) {
      const producto = await db.productos.get(item.productoId)
      if (producto) {
        await db.productos.update(item.productoId, {
          existencias: Math.max(0, producto.existencias - item.cantidad),
        })
      }
    }
  })
}
