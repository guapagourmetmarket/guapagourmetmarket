import { useState } from 'react'
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { Button } from '../../components/Button'
import { useCarrito } from '../../lib/carrito'
import { LineaCarritoItem } from './LineaCarritoItem'

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface CuentaVivaProps {
  onCobrar: () => void
}

/** Panel de "cuenta actual" visible mientras se escanea/toca un producto — igual en Táctil y Productos. */
export function CuentaViva({ onCobrar }: CuentaVivaProps) {
  const carrito = useCarrito()
  const [abierta, setAbierta] = useState(true)

  if (carrito.lineas.length === 0) return null

  return (
    <div className="gg-cuenta-viva">
      {abierta && (
        <div className="gg-cuenta-viva-cuerpo">
          <div className="gg-cuenta-viva-header">
            <span>Cuenta actual</span>
            <span>
              {carrito.lineas.reduce((acc, l) => acc + l.cantidad, 0)} und. · {carrito.lineas.length}{' '}
              producto{carrito.lineas.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className="gg-carrito-lista gg-cuenta-viva-lista">
            {carrito.lineas.map((linea) => (
              <LineaCarritoItem key={linea.producto.id} linea={linea} />
            ))}
          </ul>
        </div>
      )}
      <div className="gg-cuenta-viva-footer">
        <button type="button" className="gg-cuenta-viva-barra" onClick={() => setAbierta((v) => !v)}>
          <ShoppingCart size={18} />
          <span>
            {carrito.lineas.length} producto{carrito.lineas.length === 1 ? '' : 's'} ·{' '}
            {formatoCOP.format(carrito.total)}
          </span>
          {abierta ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <Button type="button" className="gg-cuenta-viva-cobrar" onClick={onCobrar}>
          Cobrar
        </Button>
      </div>
    </div>
  )
}
