import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Mail, MessageCircle, MessageSquareText, Printer } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ReciboVenta } from './ReciboVenta'
import { brand } from '../../theme/theme'
import { obtenerCliente, type Negocio, type Venta } from '../../lib/api'

interface ReciboModalProps {
  venta: Venta
  negocio: Negocio | null | undefined
  onClose: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const METODOS_PAGO_LABEL: Record<Venta['metodoPago'], string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  mixto: 'Mixto',
}

function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

/** Versión en texto plano del recibo, para copiar dentro de un correo/WhatsApp/SMS. */
function textoRecibo(venta: Venta, negocio: Negocio | null | undefined) {
  const lineas = [
    negocio?.nombre ?? brand.name,
    venta.pendienteSync ? 'Recibo de venta (pendiente de sincronizar)' : `Recibo de venta No. ${venta.numero}`,
    formatoFecha(venta.fecha),
    '',
    ...venta.items.map((item) => `${item.cantidad} x ${item.nombreProducto} — ${formatoCOP.format(item.subtotal)}`),
    venta.descripcion ? `— ${venta.descripcion}` : null,
    '',
    venta.descuento > 0 ? `Descuento: −${formatoCOP.format(venta.descuento)}` : null,
    `Total: ${formatoCOP.format(venta.valor)}`,
    `Método de pago: ${METODOS_PAGO_LABEL[venta.metodoPago]}`,
    '',
    '¡Gracias por tu compra!',
  ].filter((l): l is string => l !== null)
  return lineas.join('\n')
}

/** "3174047796" o "+57 317 404 7796" → "573174047796" (formato que esperan wa.me / sms:). */
function normalizarTelefono(telefono: string) {
  const digitos = telefono.replace(/\D/g, '')
  if (digitos.length === 10) return `57${digitos}`
  return digitos
}

type CanalEnvio = 'correo' | 'whatsapp' | 'sms'

const CANALES: { id: CanalEnvio; label: string; icono: typeof Mail; placeholder: string }[] = [
  { id: 'correo', label: 'Correo', icono: Mail, placeholder: 'correo@ejemplo.com' },
  { id: 'whatsapp', label: 'WhatsApp', icono: MessageCircle, placeholder: '317 404 7796' },
  { id: 'sms', label: 'Mensaje de texto', icono: MessageSquareText, placeholder: '317 404 7796' },
]

// Estilos mínimos para la ventana de impresión, con colores fijos (no
// variables CSS: esta ventana no carga el resto de la app ni applyBrand()).
const ESTILOS_IMPRESION = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12px; }
  .gg-recibo-imprimible {
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #2E332C;
  }
  .gg-recibo-header { text-align: center; }
  .gg-recibo-header p { margin: 2px 0; }
  .gg-recibo-negocio { font-weight: 700; font-size: 15px; }
  .gg-recibo-linea { border-top: 1px dashed #E5D9BF; margin: 10px 0; }
  .gg-recibo-meta p { margin: 2px 0; }
  .gg-recibo-tabla { width: 100%; border-collapse: collapse; }
  .gg-recibo-tabla th { text-align: left; font-size: 11px; text-transform: uppercase; color: #7C8279; padding-bottom: 4px; }
  .gg-recibo-tabla th:last-child, .gg-recibo-tabla td:last-child { text-align: right; }
  .gg-recibo-tabla td { padding: 3px 0; vertical-align: top; }
  .gg-recibo-fila { display: flex; justify-content: space-between; padding: 2px 0; }
  .gg-recibo-total { font-weight: 700; font-size: 15px; border-top: 1px solid #2E332C; margin-top: 4px; padding-top: 6px; }
  .gg-recibo-nota { margin-top: 10px; font-size: 8px; text-align: center; color: #A7ABA1; }
  @page { size: 80mm auto; margin: 0; }
`

/**
 * Imprime en una ventana aparte, aislada del resto de la app. Antes se
 * imprimía escondiendo el resto de la página con CSS, pero el modal usa
 * posición fija y el navegador lo repetía en cada hoja según el alto total
 * de la página (de ahí que salieran varias copias del mismo recibo).
 */
function imprimirRecibo(html: string) {
  const ventana = window.open('', '_blank', 'width=380,height=600')
  if (!ventana) {
    window.alert(
      'El navegador bloqueó la ventana de impresión. Revisa el bloqueador de ventanas emergentes (pop-ups) y permite las de este sitio.',
    )
    return
  }
  ventana.document.write(
    `<!doctype html><html><head><title>Recibo</title><style>${ESTILOS_IMPRESION}</style></head><body>${html}</body></html>`,
  )
  ventana.document.close()
  ventana.focus()
  ventana.onload = () => {
    ventana.print()
    ventana.onafterprint = () => ventana.close()
  }
}

export function ReciboModal({ venta, negocio, onClose }: ReciboModalProps) {
  const contenidoRef = useRef<HTMLDivElement>(null)
  const [canal, setCanal] = useState<CanalEnvio | null>(null)
  const [destino, setDestino] = useState('')

  // Si la venta quedó ligada a un cliente registrado, se usa su correo o
  // teléfono guardado para no tener que escribirlo cada vez.
  const { data: cliente } = useQuery({
    queryKey: ['cliente', venta.clienteId],
    queryFn: () => obtenerCliente(venta.clienteId!),
    enabled: Boolean(venta.clienteId),
  })

  function abrirCanal(id: CanalEnvio) {
    setCanal(id)
    setDestino((id === 'correo' ? cliente?.email : cliente?.telefono) ?? '')
  }

  function enviar() {
    if (!canal || !destino.trim()) return
    const texto = textoRecibo(venta, negocio)
    const asunto = `Recibo de venta No. ${venta.numero} — ${negocio?.nombre ?? brand.name}`
    if (canal === 'correo') {
      window.location.href = `mailto:${destino.trim()}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`
    } else if (canal === 'whatsapp') {
      window.open(`https://wa.me/${normalizarTelefono(destino)}?text=${encodeURIComponent(texto)}`, '_blank')
    } else {
      // El esquema sms: espera formato internacional con "+" (a diferencia
      // de wa.me, que exige puros dígitos sin él).
      window.open(`sms:+${normalizarTelefono(destino)}?body=${encodeURIComponent(texto)}`, '_blank')
    }
    setCanal(null)
    setDestino('')
  }

  return (
    <Modal
      title={venta.pendienteSync ? 'Recibo (pendiente de sincronizar)' : `Recibo No. ${venta.numero}`}
      onClose={onClose}
    >
      <div ref={contenidoRef}>
        <ReciboVenta venta={venta} negocio={negocio} />
      </div>
      <Button
        type="button"
        className="gg-recibo-boton-imprimir"
        onClick={() => {
          if (contenidoRef.current) imprimirRecibo(contenidoRef.current.innerHTML)
        }}
        style={{ width: '100%', marginTop: 20 }}
      >
        <Printer size={18} />
        Imprimir recibo
      </Button>

      <div className="gg-recibo-compartir">
        <p className="gg-recibo-compartir-titulo">O envíalo sin imprimir:</p>
        <div className="gg-recibo-compartir-botones">
          {CANALES.map(({ id, label, icono: Icono }) => (
            <button
              key={id}
              type="button"
              className={`gg-recibo-canal ${canal === id ? 'gg-recibo-canal--activo' : ''}`}
              onClick={() => abrirCanal(id)}
            >
              <Icono size={16} />
              {label}
            </button>
          ))}
        </div>

        {canal && (
          <div className="gg-recibo-compartir-form">
            <Input
              label={canal === 'correo' ? 'Correo del cliente' : 'Número de WhatsApp o celular'}
              type={canal === 'correo' ? 'email' : 'tel'}
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder={CANALES.find((c) => c.id === canal)?.placeholder}
              autoFocus
            />
            <Button type="button" onClick={enviar} disabled={!destino.trim()} style={{ width: '100%' }}>
              Enviar por {CANALES.find((c) => c.id === canal)?.label.toLowerCase()}
            </Button>
          </div>
        )}
      </div>

      <a href={brand.contacto.dianHref} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 10 }}>
        <Button type="button" variant="secondary" style={{ width: '100%' }}>
          <ExternalLink size={18} />
          Emitir factura electrónica DIAN
        </Button>
      </a>
    </Modal>
  )
}
