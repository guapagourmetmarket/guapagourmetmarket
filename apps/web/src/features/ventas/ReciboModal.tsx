import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { ReciboVenta } from './ReciboVenta'
import type { Negocio, Venta } from '../../lib/api'

interface ReciboModalProps {
  venta: Venta
  negocio: Negocio | null | undefined
  onClose: () => void
}

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
  if (!ventana) return
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

  return (
    <Modal title={`Recibo No. ${venta.numero}`} onClose={onClose}>
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
    </Modal>
  )
}
