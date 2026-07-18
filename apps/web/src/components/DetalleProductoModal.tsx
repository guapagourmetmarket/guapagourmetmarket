import { useState } from 'react'
import { Leaf } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { precioEfectivo, etiquetaPromocion } from '../lib/precio'
import './detalle-producto.css'

interface FotoProducto {
  id: string
  url: string
}

// Estructura mínima que necesita esta vista: tanto el producto interno
// (Producto, con galería) como el de la tienda pública (ProductoPublico)
// calzan aquí sin conversión — por eso casi todos los campos son
// opcionales, para aceptar cualquiera de los dos tal cual vienen.
interface ProductoParaDetalle {
  nombre: string
  descripcion?: string | null
  categoriaNombre?: string
  marcaNombre?: string | null
  precioVenta: number
  precioOferta?: number | null
  descuentoPorcentaje?: number | null
  promocionN?: number | null
  promocionM?: number | null
  imagenUrl?: string | null
  imagenes?: FotoProducto[]
}

interface DetalleProductoModalProps {
  producto: ProductoParaDetalle
  onClose: () => void
  onAgregar?: () => void
  textoAgregar?: string
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Vista de solo lectura con todas las fotos y la descripción de un producto — se usa igual desde Productos (interno) y la tienda pública. */
export function DetalleProductoModal({ producto, onClose, onAgregar, textoAgregar = 'Agregar' }: DetalleProductoModalProps) {
  const fotos: FotoProducto[] =
    producto.imagenes && producto.imagenes.length > 0
      ? producto.imagenes
      : producto.imagenUrl
        ? [{ id: 'principal', url: producto.imagenUrl }]
        : []

  const [fotoActiva, setFotoActiva] = useState(0)
  const foto = fotos[fotoActiva]
  const promo = etiquetaPromocion(producto)
  const precio = precioEfectivo({ precioVenta: producto.precioVenta, precioOferta: producto.precioOferta ?? null })

  return (
    <Modal title={producto.nombre} onClose={onClose}>
      <div className="gg-detalle-producto">
        <div className="gg-detalle-producto-imagen-grande">
          {foto ? <img src={foto.url} alt={producto.nombre} /> : <Leaf size={40} strokeWidth={1.5} />}
          {promo && <span className="gg-producto-oferta-badge gg-detalle-producto-badge">{promo}</span>}
        </div>

        {fotos.length > 1 && (
          <div className="gg-detalle-producto-miniaturas">
            {fotos.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className={
                  'gg-detalle-producto-miniatura' + (i === fotoActiva ? ' gg-detalle-producto-miniatura--activa' : '')
                }
                onClick={() => setFotoActiva(i)}
                aria-label={`Ver foto ${i + 1}`}
              >
                <img src={f.url} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="gg-detalle-producto-info">
          {(producto.categoriaNombre || producto.marcaNombre) && (
            <p className="gg-detalle-producto-meta">
              {[producto.categoriaNombre, producto.marcaNombre].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="gg-detalle-producto-precio">
            {producto.descuentoPorcentaje ? (
              <span className="gg-detalle-producto-precio-tachado">{formatoCOP.format(producto.precioVenta)}</span>
            ) : null}
            <span>{formatoCOP.format(precio)}</span>
          </div>
          <p
            className={
              'gg-detalle-producto-descripcion' +
              (producto.descripcion ? '' : ' gg-detalle-producto-descripcion--vacia')
            }
          >
            {producto.descripcion || 'Este producto todavía no tiene descripción.'}
          </p>
        </div>

        {onAgregar && (
          <Button type="button" size="lg" style={{ width: '100%' }} onClick={onAgregar}>
            {textoAgregar}
          </Button>
        )}
      </div>
    </Modal>
  )
}
