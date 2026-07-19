import type { PedidoWeb } from '../../lib/api'
import { brand } from '../../theme/theme'

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatoFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

function separador(ctx: CanvasRenderingContext2D, margen: number, ancho: number, y: number) {
  ctx.strokeStyle = '#D8CFBE'
  ctx.beginPath()
  ctx.moveTo(margen, y)
  ctx.lineTo(ancho - margen, y)
  ctx.stroke()
}

/** Dibuja el pedido como una imagen tipo recibo, para adjuntar a mano en WhatsApp u otro chat. */
export function generarImagenPedido(pedido: PedidoWeb): Promise<Blob> {
  const escala = 2
  const ancho = 380 * escala
  const margen = 24 * escala
  const lineaAlto = 22 * escala

  const alturaBase = 260
  const alturaItems = pedido.items.length * 22
  const alturaDescuento = pedido.descuento > 0 ? 26 : 0
  const alturaNotas = pedido.notas ? 30 : 0
  const alto = (alturaBase + alturaItems + alturaDescuento + alturaNotas) * escala

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Este navegador no puede generar el recibo.')

  ctx.fillStyle = '#FAF5EC'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.textBaseline = 'top'

  let y = margen

  ctx.fillStyle = '#2E332C'
  ctx.font = `bold ${16 * escala}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(brand.name, ancho / 2, y)
  y += 22 * escala

  ctx.font = `${11 * escala}px sans-serif`
  ctx.fillStyle = '#6B6459'
  ctx.fillText(brand.contacto.direccion, ancho / 2, y)
  y += 28 * escala

  separador(ctx, margen, ancho, y)
  y += 16 * escala

  ctx.textAlign = 'left'
  ctx.fillStyle = '#2E332C'
  ctx.font = `bold ${13 * escala}px sans-serif`
  ctx.fillText(`Pedido No. ${pedido.numero}`, margen, y)
  y += lineaAlto

  ctx.font = `${11 * escala}px sans-serif`
  ctx.fillStyle = '#6B6459'
  ctx.fillText(formatoFechaHora(pedido.createdAt), margen, y)
  y += lineaAlto
  ctx.fillText(`Cliente: ${pedido.clienteNombre} · ${pedido.clienteTelefono}`, margen, y)
  y += lineaAlto + 8 * escala

  separador(ctx, margen, ancho, y)
  y += 16 * escala

  ctx.fillStyle = '#2E332C'
  ctx.font = `${12 * escala}px sans-serif`
  for (const item of pedido.items) {
    ctx.textAlign = 'left'
    ctx.fillText(`${item.cantidad} x ${item.nombreProducto}`, margen, y, ancho - margen * 2 - 90 * escala)
    ctx.textAlign = 'right'
    ctx.fillText(formatoCOP.format(item.subtotal), ancho - margen, y)
    y += lineaAlto
  }
  y += 8 * escala

  separador(ctx, margen, ancho, y)
  y += 16 * escala

  if (pedido.descuento > 0) {
    ctx.font = `${12 * escala}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(`Descuento (${pedido.cuponCodigo})`, margen, y)
    ctx.textAlign = 'right'
    ctx.fillText(`-${formatoCOP.format(pedido.descuento)}`, ancho - margen, y)
    y += lineaAlto + 4 * escala
  }

  ctx.font = `bold ${14 * escala}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('Total', margen, y)
  ctx.textAlign = 'right'
  ctx.fillText(formatoCOP.format(pedido.valor), ancho - margen, y)
  y += lineaAlto + 8 * escala

  if (pedido.notas) {
    ctx.font = `italic ${11 * escala}px sans-serif`
    ctx.fillStyle = '#6B6459'
    ctx.textAlign = 'left'
    ctx.fillText(`Notas: ${pedido.notas}`, margen, y, ancho - margen * 2)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('No se pudo generar el recibo.'))
      else resolve(blob)
    }, 'image/png')
  })
}

export async function descargarImagenPedido(pedido: PedidoWeb) {
  const blob = await generarImagenPedido(pedido)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedido-${pedido.numero}.png`
  a.click()
  URL.revokeObjectURL(url)
}
