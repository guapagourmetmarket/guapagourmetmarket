import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import JsBarcode from 'jsbarcode'
import type { Producto } from '@guapa/shared'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ApiError, actualizarProducto } from '../../lib/api'
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

/** Dígito de control real de EAN-13, para que el código generado sea válido. */
function digitoControlEAN13(cuerpo12: string): string {
  const suma = cuerpo12
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  const resto = suma % 10
  return String(resto === 0 ? 0 : 10 - resto)
}

/** Genera un EAN-13 en el rango 20-29, reservado por GS1 para uso interno/circulación restringida. */
function generarCodigoInterno(): string {
  const cuerpo = '20' + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
  return cuerpo + digitoControlEAN13(cuerpo)
}

export function EtiquetaModal({ producto, onClose }: EtiquetaModalProps) {
  const queryClient = useQueryClient()
  const svgRef = useRef<SVGSVGElement>(null)
  const [cantidad, setCantidad] = useState('12')
  const [codigoNuevo, setCodigoNuevo] = useState('')
  const [codigoGuardado, setCodigoGuardado] = useState<string | null>(null)

  const codigoBarras = codigoGuardado ?? producto.codigoBarras
  const valor = codigoBarras || producto.codigoInterno

  const mutacionAsignar = useMutation({
    mutationFn: (codigo: string) => actualizarProducto(producto.id, { codigoBarras: codigo }),
    onSuccess: (_actualizado, codigo) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setCodigoGuardado(codigo)
      setCodigoNuevo('')
    },
  })

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

  function handleAsignar(e: FormEvent) {
    e.preventDefault()
    if (codigoNuevo.trim()) mutacionAsignar.mutate(codigoNuevo.trim())
  }

  return (
    <Modal title="Imprimir etiqueta" onClose={onClose}>
      <p className="gg-etiqueta-nota">
        Código: <strong>{valor}</strong>
        {!codigoBarras && ' — código interno (este producto todavía no tiene código de barras propio)'}
      </p>

      <div className="gg-etiqueta-preview">
        <svg ref={svgRef} />
      </div>

      {!codigoBarras && (
        <form onSubmit={handleAsignar} noValidate className="gg-etiqueta-asignar">
          <p className="gg-etiqueta-nota">
            Para un producto de marca propia (sin código de fábrica): escanéalo con tu lector si
            ya le pegaste una etiqueta de otra fuente, o genera uno nuevo para asignárselo.
          </p>
          <Input
            label="Código de barras nuevo"
            type="text"
            value={codigoNuevo}
            onChange={(e) => setCodigoNuevo(e.target.value)}
            placeholder="Escanea aquí o escribe el código"
            autoFocus
          />
          <div className="gg-etiqueta-asignar-acciones">
            <Button type="button" variant="secondary" onClick={() => setCodigoNuevo(generarCodigoInterno())}>
              Generar código
            </Button>
            <Button type="submit" disabled={!codigoNuevo.trim() || mutacionAsignar.isPending}>
              {mutacionAsignar.isPending ? 'Guardando…' : 'Asignar código'}
            </Button>
          </div>
          {mutacionAsignar.isError && (
            <p className="gg-field-error">
              {mutacionAsignar.error instanceof ApiError
                ? mutacionAsignar.error.message
                : 'No pudimos asignar el código. Intenta de nuevo.'}
            </p>
          )}
        </form>
      )}

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
