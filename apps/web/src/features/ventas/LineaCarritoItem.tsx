import { Leaf, Trash2 } from 'lucide-react'
import { useCarrito, type LineaCarrito } from '../../lib/carrito'
import { precioEfectivo, subtotalEfectivo } from '../../lib/precio'
import { ControlCantidad } from './ControlCantidad'

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface LineaCarritoItemProps {
  linea: LineaCarrito
}

/** Fila de un producto ya escaneado/agregado — con foto, para saber de un vistazo qué es. */
export function LineaCarritoItem({ linea }: LineaCarritoItemProps) {
  const carrito = useCarrito()
  const { producto } = linea

  return (
    <li className="gg-carrito-linea">
      <div className="gg-carrito-linea-imagen">
        {producto.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.nombre} />
        ) : (
          <Leaf size={16} strokeWidth={1.5} />
        )}
      </div>
      <div className="gg-carrito-linea-info">
        <span className="gg-carrito-linea-nombre">{producto.nombre}</span>
        <span className="gg-carrito-linea-precio">
          {producto.descuentoPorcentaje && (
            <span className="gg-carrito-linea-precio-tachado">
              {formatoCOP.format(producto.precioVenta)}
            </span>
          )}
          {formatoCOP.format(precioEfectivo(producto))}{' '}
          {producto.vendePorPeso ? `/ ${producto.unidadMedida}` : 'c/u'}
          {producto.descuentoPorcentaje && (
            <span className="gg-carrito-linea-oferta">-{producto.descuentoPorcentaje}%</span>
          )}
          {producto.promocionN && producto.promocionM && (
            <span className="gg-carrito-linea-oferta">
              {producto.promocionN}x{producto.promocionM}
            </span>
          )}
        </span>
      </div>
      <ControlCantidad linea={linea} />
      <span className="gg-carrito-linea-subtotal">
        {formatoCOP.format(subtotalEfectivo(producto, linea.cantidad))}
      </span>
      <button
        type="button"
        className="gg-carrito-linea-quitar"
        onClick={() => carrito.quitarLinea(producto.id)}
        aria-label="Quitar producto"
      >
        <Trash2 size={16} />
      </button>
    </li>
  )
}
