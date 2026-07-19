import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle2, Download, Leaf, MessageCircle, ShoppingBag } from 'lucide-react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ApiError, crearPedidoWebPublico, type PedidoWeb } from '../../lib/api'
import { useCarritoPublico } from '../../lib/carritoPublico'
import { etiquetaPromocion, precioEfectivo, subtotalEfectivo } from '../../lib/precio'
import { brand } from '../../theme/theme'
import { CuponInput } from '../ventas/CuponInput'
import { descargarImagenPedido } from './generarReciboImagen'
import '../../components/app-header.css'
import '../ventas/ventas.css'
import './tienda.css'

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatoFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

// Mismo contenido que el recibo de venta (negocio, número, items, total),
// pero en texto plano con el *negrita*/_cursiva_ que WhatsApp sí entiende.
function textoWhatsApp(pedido: PedidoWeb) {
  const lineas = [
    `*${brand.name}*`,
    brand.contacto.direccion,
    '',
    `*Pedido No. ${pedido.numero}*`,
    formatoFechaHora(pedido.createdAt),
    `Cliente: ${pedido.clienteNombre} · ${pedido.clienteTelefono}`,
    '',
    ...pedido.items.map((i) => `${i.cantidad} x ${i.nombreProducto} — ${formatoCOP.format(i.subtotal)}`),
    '',
    pedido.descuento > 0
      ? `Descuento (${pedido.cuponCodigo}): -${formatoCOP.format(pedido.descuento)}`
      : null,
    `*Total: ${formatoCOP.format(pedido.valor)}*`,
    pedido.notas ? `Notas: ${pedido.notas}` : null,
    '',
    '_Este pedido ya quedó guardado en el sistema — te escribo para coordinar el pago y la entrega._',
  ].filter((l): l is string => l !== null)
  return lineas.join('\n')
}

export function PedidoWebCheckoutScreen() {
  const carrito = useCarritoPublico()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [pedidoConfirmado, setPedidoConfirmado] = useState<PedidoWeb | null>(null)
  const [cupon, setCupon] = useState<{ codigo: string; porcentaje: number } | null>(null)

  const descuento = cupon ? Math.round(carrito.total * (cupon.porcentaje / 100)) : 0
  const totalConDescuento = carrito.total - descuento

  const mutacion = useMutation({
    mutationFn: crearPedidoWebPublico,
    onSuccess: (pedido) => {
      setPedidoConfirmado(pedido)
      carrito.vaciar()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (nombre.trim().length < 2 || telefono.trim().length < 7) {
      setError('Escribe tu nombre y un número de celular válido.')
      return
    }
    mutacion.mutate({
      clienteNombre: nombre.trim(),
      clienteTelefono: telefono.trim(),
      notas: notas.trim() || undefined,
      items: carrito.lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
      cuponCodigo: cupon?.codigo,
    })
  }

  // El número de WhatsApp del negocio se toma del mismo enlace que ya usa
  // el resto de la app (brand.contacto.whatsappHref), en formato wa.me.
  const whatsappNegocio = brand.contacto.whatsappHref.replace('https://wa.me/', '')

  return (
    <div className="gg-productos-page">
      <header className="gg-header">
        <div className="gg-header-marca">
          <div className="gg-header-marca-fila">
            <img src={brand.logo.hi} alt={brand.name} width={64} height={64} />
            <span className="font-display gg-header-marca-nombre">{brand.name}</span>
          </div>
        </div>
      </header>

      <main className="gg-pedido-web-main">
        {pedidoConfirmado ? (
          <Card>
            <div className="gg-pedido-web-confirmacion">
              <CheckCircle2 size={40} className="gg-pedido-web-confirmacion-icono" />
              <h2>¡Pedido No. {pedidoConfirmado.numero} recibido!</h2>
              {pedidoConfirmado.descuento > 0 && (
                <p className="gg-cupon-aplicado" style={{ justifyContent: 'center' }}>
                  Cupón {pedidoConfirmado.cuponCodigo} aplicado (-{formatoCOP.format(pedidoConfirmado.descuento)})
                </p>
              )}
              <p className="gg-pedido-web-confirmacion-subtitulo">Estos son los productos de tu pedido:</p>
              <ul className="gg-carrito-lista">
                {pedidoConfirmado.items.map((item) => (
                  <li key={item.id} className="gg-carrito-linea">
                    <div className="gg-carrito-linea-info">
                      <span className="gg-carrito-linea-nombre">
                        {item.cantidad} x {item.nombreProducto}
                      </span>
                    </div>
                    <span className="gg-carrito-linea-subtotal">{formatoCOP.format(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="gg-pedido-web-total">
                <span>Total</span>
                <span>{formatoCOP.format(pedidoConfirmado.valor)}</span>
              </div>
              <p>
                Dale <strong>Enviar</strong> en WhatsApp para contactarte con {brand.name} y coordinar
                el envío y el método de pago. El valor del domicilio y la forma de pago se coordinan
                directamente con nosotros — no se cobra nada en este momento.
              </p>
              <a
                href={`https://wa.me/${whatsappNegocio}?text=${encodeURIComponent(textoWhatsApp(pedidoConfirmado))}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="button" style={{ width: '100%' }}>
                  <MessageCircle size={18} />
                  Avisar por WhatsApp
                </Button>
              </a>
              <div style={{ marginTop: 8 }}>
                <Button
                  type="button"
                  variant="secondary"
                  style={{ width: '100%' }}
                  onClick={() => descargarImagenPedido(pedidoConfirmado)}
                >
                  <Download size={18} />
                  Descargar recibo
                </Button>
              </div>
              <p className="gg-pedido-web-recibo-ayuda">
                Si prefieres, descarga el recibo y adjúntalo en el chat de WhatsApp que ya se abrió.
              </p>
              <div style={{ marginTop: 12 }}>
                <Link to="/tienda">
                  <Button type="button" variant="secondary" style={{ width: '100%' }}>
                    Volver a la tienda
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : carrito.lineas.length === 0 ? (
          <Card className="gg-productos-estado">
            <p>Tu carrito está vacío.</p>
            <div style={{ marginTop: 12 }}>
              <Link to="/tienda">
                <Button type="button">
                  <ShoppingBag size={18} />
                  Ir a la tienda
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <h1 className="font-display gg-pedido-web-title">Tu pedido</h1>
            <p className="gg-pedido-web-subtitulo">
              Revisa lo que vas a pedir. El pago se coordina directo con nosotros — no se cobra nada
              en este momento.
            </p>

            <Card>
              {carrito.lineas.map((linea) => (
                <div key={linea.producto.id} className="gg-pedido-web-linea">
                  <div className="gg-pedido-web-linea-imagen">
                    {linea.producto.imagenUrl ? (
                      <img src={linea.producto.imagenUrl} alt={linea.producto.nombre} />
                    ) : (
                      <Leaf size={20} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="gg-pedido-web-linea-info">
                    <p className="gg-pedido-web-linea-nombre">{linea.producto.nombre}</p>
                    <p className="gg-pedido-web-linea-precio">
                      {formatoCOP.format(precioEfectivo(linea.producto))} c/u
                      {etiquetaPromocion(linea.producto) && (
                        <span className="gg-pedido-web-linea-promo"> · {etiquetaPromocion(linea.producto)}</span>
                      )}
                    </p>
                  </div>
                  <div className="gg-pedido-web-cantidad">
                    <button type="button" onClick={() => carrito.cambiarCantidad(linea.producto.id, -1)}>
                      −
                    </button>
                    <span>{linea.cantidad}</span>
                    <button type="button" onClick={() => carrito.cambiarCantidad(linea.producto.id, 1)}>
                      +
                    </button>
                  </div>
                  <span className="gg-pedido-web-subtotal">
                    {formatoCOP.format(subtotalEfectivo(linea.producto, linea.cantidad))}
                  </span>
                </div>
              ))}

              <CuponInput
                onAplicar={(porcentaje, codigo) => setCupon({ codigo, porcentaje })}
                onQuitar={() => setCupon(null)}
              />

              {descuento > 0 && (
                <>
                  <div className="gg-venta-subtotal">
                    <span>Subtotal</span>
                    <span>{formatoCOP.format(carrito.total)}</span>
                  </div>
                  <div className="gg-venta-subtotal">
                    <span>Descuento</span>
                    <span>−{formatoCOP.format(descuento)}</span>
                  </div>
                </>
              )}

              <div className="gg-pedido-web-total">
                <span>Total</span>
                <span>{formatoCOP.format(totalConDescuento)}</span>
              </div>
            </Card>

            <Card style={{ marginTop: 16 }}>
              <form onSubmit={handleSubmit} noValidate className="gg-pedido-web-form">
                <Input
                  label="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. María Pérez"
                  autoComplete="name"
                />
                <Input
                  label="Tu celular (WhatsApp de preferencia)"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="317 404 7796"
                  autoComplete="tel"
                />
                <Input
                  label="Notas (opcional)"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. lo recojo en tienda, o dirección de entrega"
                />

                {(error || mutacion.isError) && (
                  <p className="gg-field-error">
                    {error ||
                      (mutacion.error instanceof ApiError
                        ? mutacion.error.message
                        : 'No pudimos enviar tu pedido. Intenta de nuevo.')}
                  </p>
                )}

                <Button type="submit" disabled={mutacion.isPending} style={{ width: '100%' }}>
                  {mutacion.isPending ? 'Enviando…' : 'Confirmar pedido'}
                </Button>
              </form>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
