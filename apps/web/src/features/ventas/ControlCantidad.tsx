import { Minus, Plus } from 'lucide-react'
import { useCarrito, type LineaCarrito } from '../../lib/carrito'

interface ControlCantidadProps {
  linea: LineaCarrito
}

export function ControlCantidad({ linea }: ControlCantidadProps) {
  const carrito = useCarrito()

  if (linea.producto.vendePorPeso) {
    return (
      <div className="gg-carrito-linea-controles gg-carrito-linea-controles--peso">
        <input
          type="number"
          className="gg-input gg-carrito-peso-input"
          min="0"
          step="0.001"
          value={linea.cantidad}
          onChange={(e) =>
            carrito.establecerCantidad(linea.producto.id, Math.max(0, Number(e.target.value) || 0))
          }
          aria-label={`Cantidad en ${linea.producto.unidadMedida}`}
        />
        <span className="gg-carrito-peso-unidad">{linea.producto.unidadMedida}</span>
      </div>
    )
  }

  return (
    <div className="gg-carrito-linea-controles">
      <button
        type="button"
        onClick={() => carrito.cambiarCantidad(linea.producto.id, -1)}
        aria-label="Quitar una unidad"
      >
        <Minus size={14} />
      </button>
      <span>{linea.cantidad}</span>
      <button
        type="button"
        onClick={() => carrito.cambiarCantidad(linea.producto.id, 1)}
        aria-label="Agregar una unidad"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
