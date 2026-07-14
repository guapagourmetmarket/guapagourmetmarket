import { db, descontarStockCache } from './db'
import {
  ApiError,
  esErrorDeRed,
  registrarVenta,
  type NuevaVenta,
  type Venta,
  type VentaItem,
} from './api'

async function construirVentaLocal(venta: NuevaVenta): Promise<Venta> {
  const items: VentaItem[] = []
  let totalItems = 0
  for (const item of venta.items) {
    const producto = await db.productos.get(item.productoId)
    const precioUnitario = producto?.precioVenta ?? 0
    const subtotal = precioUnitario * item.cantidad
    totalItems += subtotal
    items.push({
      id: crypto.randomUUID(),
      productoId: item.productoId,
      nombreProducto: producto?.nombre ?? 'Producto',
      cantidad: item.cantidad,
      precioUnitario,
      iva: producto?.iva ?? 0,
      subtotal,
    })
  }

  const subtotal = totalItems + (venta.valorLibre ?? 0)
  const descuento = Math.min(venta.descuento ?? 0, subtotal)

  return {
    id: crypto.randomUUID(),
    numero: 0,
    fecha: venta.fecha ?? new Date().toISOString().slice(0, 10),
    clienteId: venta.clienteId ?? null,
    clienteNombre: venta.clienteNombre ?? null,
    descripcion: venta.descripcion ?? null,
    valor: subtotal - descuento,
    descuento,
    metodoPago: venta.metodoPago,
    origen: 'pos',
    pagado: !venta.fiado,
    fechaVencimientoPago: venta.fechaVencimientoPago ?? null,
    items,
    pendienteSync: true,
  }
}

/**
 * Intenta registrar la venta en el servidor. Si no hay internet, la guarda en
 * la cola local (outbox) y descuenta el stock en la caché para que la
 * siguiente venta offline vea existencias correctas; se sincroniza sola al
 * reconectar. Errores del servidor (stock insuficiente, cliente inválido,
 * etc.) sí se propagan: solo la falta de conexión se encola.
 */
export async function registrarVentaConSync(venta: NuevaVenta): Promise<Venta> {
  try {
    return await registrarVenta(venta)
  } catch (err) {
    if (!esErrorDeRed(err)) throw err
    const ventaLocal = await construirVentaLocal(venta)
    await db.outboxVentas.add({ id: ventaLocal.id, payload: venta, creadoEn: new Date().toISOString() })
    await descontarStockCache(venta.items)
    return ventaLocal
  }
}

let sincronizando = false

/** Envía en orden las ventas encoladas offline. Se detiene ante el primer fallo de red para no perder el orden. */
export async function sincronizarOutbox() {
  if (sincronizando) return
  sincronizando = true
  try {
    const pendientes = await db.outboxVentas.orderBy('creadoEn').toArray()
    for (const item of pendientes) {
      try {
        await registrarVenta(item.payload)
        await db.outboxVentas.delete(item.id)
      } catch (err) {
        if (esErrorDeRed(err)) break
        await db.outboxVentas.update(item.id, {
          error: err instanceof ApiError ? err.message : 'No se pudo sincronizar esta venta.',
        })
      }
    }
  } finally {
    sincronizando = false
  }
}

export function iniciarSincronizacionAutomatica() {
  window.addEventListener('online', () => {
    sincronizarOutbox()
  })
  setInterval(() => {
    if (navigator.onLine) sincronizarOutbox()
  }, 30000)
  if (navigator.onLine) sincronizarOutbox()
}
