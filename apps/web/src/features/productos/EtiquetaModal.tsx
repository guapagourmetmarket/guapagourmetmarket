import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import type { Producto } from '@guapa/shared'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import './etiqueta.css'

interface EtiquetaModalProps {
  producto: Producto
  onClose: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Página suelta, no una hoja de referencias de un proveedor de etiquetas: se
// arma una cuadrícula simple de 3 columnas en A4/carta que sirve para
// recortar, sin depender de un tamaño de plantilla exacto.
const ESTILOS_ETIQUETAS = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 8mm; font-family: Arial, Helvetica, sans-serif; }
  .gg-hoja-etiquetas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
  .gg-etiqueta {
    border: 1px dashed #ccc;
    border-radius: 2mm;
    padding: 2mm 2mm 3mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    break-inside: avoid;
  }
  .gg-etiqueta svg { width: 100%; height: auto; max-height: 16mm; }
  .gg-etiqueta-nombre {
    font-size: 9px;
    font-weight: 700;
    margin: 1mm 0 0;
    line-height: 1.15;
    max-height: 2.3em;
    overflow: hidden;
  }
  .gg-etiqueta-precio { font-size: 12px; font-weight: 700; margin-top: 1mm; }
  @page { size: A4; margin: 8mm; }
`

function imprimirEtiquetas(svgHtml: string, nombre: string, precio: string, cantidad: number) {
  const ventana = window.open('', '_blank', 'width=480,height=640')
  if (!ventana) return
  const etiqueta = `<div class="gg-etiqueta">${svgHtml}<p class="gg-etiqueta-nombre">${nombre}</p><p class="gg-etiqueta-precio">${precio}</p></div>`
  ventana.document.write(
    `<!doctype html><html><head><title>Etiquetas</title><style>${ESTILOS_ETIQUETAS}</style></head><body><div class="gg-hoja-etiquetas">${etiqueta.repeat(cantidad)}</div></body></html>`,
  )
  ventana.document.close()
  ventana.focus()
  ventana.onload = () => {
    ventana.print()
    ventana.onafterprint = () => ventana.close()
  }
}

export function EtiquetaModal({ producto, onClose }: EtiquetaModalProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cantidad, setCantidad] = useState('12')
  const valor = producto.codigoBarras || producto.codigoInterno

  useEffect(() => {
    if (!svgRef.current) return
    JsBarcode(svgRef.current, valor, {
      format: 'CODE128',
      width: 1.6,
      height: 40,
      displayValue: true,
      fontSize: 11,
      margin: 4,
    })
  }, [valor])

  function handleImprimir() {
    if (!svgRef.current) return
    const n = Math.max(1, Math.min(200, Math.trunc(Number(cantidad)) || 1))
    imprimirEtiquetas(svgRef.current.outerHTML, producto.nombre, formatoCOP.format(producto.precioVenta), n)
  }

  return (
    <Modal title="Imprimir etiqueta" onClose={onClose}>
      <p className="gg-etiqueta-nota">
        Código: <strong>{valor}</strong>
        {!producto.codigoBarras && ' — código interno (este producto no tiene código de fábrica)'}
      </p>

      <div className="gg-etiqueta-preview">
        <svg ref={svgRef} />
      </div>

      <Input
        label="Cuántas etiquetas imprimir"
        type="number"
        min="1"
        max="200"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
      />

      <div className="gg-etiqueta-acciones">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button type="button" onClick={handleImprimir}>
          Imprimir
        </Button>
      </div>
    </Modal>
  )
}
