import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Leaf, Plus, ShoppingCart } from 'lucide-react'
import type { Producto } from '@guapa/shared'
import { Button } from '../../components/Button'
import { useCarrito } from '../../lib/carrito'
import { filtrarProductosPorTexto } from '../../lib/buscarProductos'
import { precioEfectivo } from '../../lib/precio'
import { LineaCarritoItem } from './LineaCarritoItem'
import { AgregarProductoLibre } from './AgregarProductoLibre'

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface CuentaVivaProps {
  onCobrar: () => void
  /** Catálogo completo, para poder agregar aquí mismo un producto por nombre sin subir a buscarlo. */
  productos?: Producto[]
}

/** Panel de "cuenta actual" visible mientras se escanea/toca un producto — igual en Táctil y Productos. */
export function CuentaViva({ onCobrar, productos = [] }: CuentaVivaProps) {
  const carrito = useCarrito()
  const [abierta, setAbierta] = useState(true)
  const [agregando, setAgregando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const resultadosBusqueda = useMemo(
    () => filtrarProductosPorTexto(productos, busqueda, 6),
    [productos, busqueda],
  )

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

          {!agregando ? (
            <button type="button" className="gg-cuenta-viva-agregar-boton" onClick={() => setAgregando(true)}>
              <Plus size={15} />
              Agregar otro producto
            </button>
          ) : (
            <div className="gg-cuenta-viva-agregar">
              <input
                type="search"
                className="gg-input gg-cuenta-viva-agregar-input"
                placeholder="Buscar por nombre o código…"
                value={busqueda}
                autoFocus
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {resultadosBusqueda.length > 0 && (
                <ul className="gg-cuenta-viva-agregar-resultados">
                  {resultadosBusqueda.map((producto) => (
                    <li key={producto.id}>
                      <button
                        type="button"
                        className="gg-cuenta-viva-resultado"
                        onClick={() => {
                          carrito.agregarProducto(producto)
                          setBusqueda('')
                          setAgregando(false)
                        }}
                      >
                        <div className="gg-cuenta-viva-resultado-imagen">
                          {producto.imagenUrl ? (
                            <img src={producto.imagenUrl} alt={producto.nombre} />
                          ) : (
                            <Leaf size={18} strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="gg-cuenta-viva-resultado-info">
                          <span className="gg-cuenta-viva-resultado-nombre">{producto.nombre}</span>
                          <span className="gg-cuenta-viva-resultado-precio">
                            {formatoCOP.format(precioEfectivo(producto))}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <AgregarProductoLibre
                nombreInicial={resultadosBusqueda.length === 0 ? busqueda.trim() : ''}
                onAgregar={(nombre, precio) => {
                  carrito.agregarLineaLibre(nombre, precio)
                  setBusqueda('')
                  setAgregando(false)
                }}
              />
              <button type="button" className="gg-cuenta-viva-agregar-cancelar" onClick={() => setAgregando(false)}>
                Cancelar
              </button>
            </div>
          )}
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
