import { useState } from 'react'
import { AlertTriangle, Leaf, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Producto } from '@guapa/shared'

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Un precio de compra de $1 (o menos) casi siempre es un valor puesto de afán, no el real. */
function esPrecioCompraSospechoso(precioCompra: number) {
  return precioCompra <= 1
}

interface CeldaPrecioCompraProps {
  producto: Producto
  onGuardar: (id: string, precioCompra: number) => void
  guardando: boolean
}

function CeldaPrecioCompra({ producto, onGuardar, guardando }: CeldaPrecioCompraProps) {
  const [valor, setValor] = useState(String(producto.precioCompra))

  function confirmar() {
    const nuevo = Number(valor)
    if (!Number.isFinite(nuevo) || nuevo < 0) {
      setValor(String(producto.precioCompra))
      return
    }
    if (nuevo !== producto.precioCompra) onGuardar(producto.id, nuevo)
  }

  return (
    <div className={'gg-tabla-precio-compra' + (esPrecioCompraSospechoso(producto.precioCompra) ? ' gg-tabla-precio-compra--sospechoso' : '')}>
      {esPrecioCompraSospechoso(producto.precioCompra) && (
        <AlertTriangle size={14} className="gg-tabla-precio-compra-alerta" />
      )}
      <input
        type="number"
        className="gg-input gg-tabla-precio-compra-input"
        min="0"
        step="1"
        value={valor}
        disabled={guardando}
        onChange={(e) => setValor(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
    </div>
  )
}

interface ProductosTablaProps {
  productos: Producto[]
  guardandoId: string | null
  onGuardarPrecioCompra: (id: string, precioCompra: number) => void
}

/**
 * Vista de lista, pensada para revisar muchos productos de un vistazo y
 * corregir el precio de compra ahí mismo, sin abrir cada ficha. Ordenada de
 * menor a mayor precio de compra para que los que quedaron en $0/$1 "de
 * afán" queden primero.
 */
export function ProductosTabla({ productos, guardandoId, onGuardarPrecioCompra }: ProductosTablaProps) {
  const ordenados = [...productos].sort((a, b) => a.precioCompra - b.precioCompra)

  return (
    <div className="gg-tabla-productos-wrap">
      <table className="gg-tabla-productos">
        <thead>
          <tr>
            <th></th>
            <th>Código interno</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio de compra</th>
            <th>Precio de venta</th>
            <th>Existencias</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((producto) => (
            <tr
              key={producto.id}
              className={producto.activo === false ? 'gg-tabla-fila--inactivo' : undefined}
            >
              <td>
                <div className="gg-tabla-imagen">
                  {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  ) : (
                    <Leaf size={16} strokeWidth={1.5} />
                  )}
                </div>
              </td>
              <td className="gg-tabla-codigo">{producto.codigoInterno}</td>
              <td className="gg-tabla-nombre">{producto.nombre}</td>
              <td className="gg-tabla-categoria">{producto.categoriaNombre}</td>
              <td>
                <CeldaPrecioCompra
                  producto={producto}
                  guardando={guardandoId === producto.id}
                  onGuardar={onGuardarPrecioCompra}
                />
              </td>
              <td className="gg-tabla-precio-venta">{formatoCOP.format(producto.precioVenta)}</td>
              <td className="gg-tabla-existencias">{producto.existencias}</td>
              <td>
                <Link
                  to={`/productos/${producto.id}/editar`}
                  className="gg-producto-accion"
                  title="Editar ficha completa"
                >
                  <Pencil size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
