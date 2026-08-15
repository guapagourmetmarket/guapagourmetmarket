import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Leaf, Pencil } from 'lucide-react'
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

interface CeldaCodigoInternoProps {
  producto: Producto
  onGuardar: (id: string, codigoInterno: string) => void
  guardando: boolean
}

function CeldaCodigoInterno({ producto, onGuardar, guardando }: CeldaCodigoInternoProps) {
  const [valor, setValor] = useState(producto.codigoInterno)

  function confirmar() {
    const nuevo = valor.trim()
    if (!nuevo) {
      setValor(producto.codigoInterno)
      return
    }
    if (nuevo !== producto.codigoInterno) onGuardar(producto.id, nuevo)
  }

  return (
    <input
      type="text"
      className="gg-input gg-tabla-codigo-input"
      value={valor}
      disabled={guardando}
      onChange={(e) => setValor(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

type Campo =
  | 'codigoInterno'
  | 'nombre'
  | 'marcaNombre'
  | 'categoriaNombre'
  | 'precioCompra'
  | 'precioVenta'
  | 'existencias'

const COLUMNAS: { campo: Campo; etiqueta: string }[] = [
  { campo: 'codigoInterno', etiqueta: 'Código interno' },
  { campo: 'nombre', etiqueta: 'Nombre' },
  { campo: 'marcaNombre', etiqueta: 'Marca' },
  { campo: 'categoriaNombre', etiqueta: 'Categoría' },
  { campo: 'precioCompra', etiqueta: 'Precio de compra' },
  { campo: 'precioVenta', etiqueta: 'Precio de venta' },
  { campo: 'existencias', etiqueta: 'Disponibilidad' },
]

const CAMPOS_TEXTO = new Set<Campo>(['codigoInterno', 'nombre', 'marcaNombre', 'categoriaNombre'])

function valorDeCampo(producto: Producto, campo: Campo): string | number {
  const v = producto[campo]
  if (CAMPOS_TEXTO.has(campo)) {
    return (v as string | undefined)?.toLowerCase() ?? ''
  }
  return (v as number | undefined) ?? 0
}

interface ProductosTablaProps {
  productos: Producto[]
  guardandoId: string | null
  onGuardarPrecioCompra: (id: string, precioCompra: number) => void
  onGuardarCodigoInterno: (id: string, codigoInterno: string) => void
}

/**
 * Vista de lista, pensada para revisar muchos productos de un vistazo,
 * ordenarlos por lo que se necesite (nombre, marca, categoría, precio,
 * disponibilidad) y corregir el precio de compra ahí mismo, sin abrir cada
 * ficha. Por defecto ordena de menor a mayor precio de compra, para que los
 * que quedaron en $0/$1 "de afán" queden primero.
 */
export function ProductosTabla({
  productos,
  guardandoId,
  onGuardarPrecioCompra,
  onGuardarCodigoInterno,
}: ProductosTablaProps) {
  const [ordenPor, setOrdenPor] = useState<Campo>('precioCompra')
  const [ascendente, setAscendente] = useState(true)

  function ordenarPor(campo: Campo) {
    if (campo === ordenPor) {
      setAscendente((v) => !v)
    } else {
      setOrdenPor(campo)
      setAscendente(true)
    }
  }

  const ordenados = useMemo(() => {
    const copia = [...productos]
    copia.sort((a, b) => {
      let cmp: number
      if (ordenPor === 'codigoInterno') {
        // "numeric: true" compara los números escritos adentro del texto por
        // su valor (2 antes que 11), no letra por letra (que pondría "11"
        // antes que "2" al comparar el primer caracter).
        cmp = a.codigoInterno.localeCompare(b.codigoInterno, 'es', { numeric: true })
      } else {
        const va = valorDeCampo(a, ordenPor)
        const vb = valorDeCampo(b, ordenPor)
        cmp = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)
      }
      return ascendente ? cmp : -cmp
    })
    return copia
  }, [productos, ordenPor, ascendente])

  return (
    <div className="gg-tabla-productos-wrap">
      <table className="gg-tabla-productos">
        <thead>
          <tr>
            <th></th>
            {COLUMNAS.map(({ campo, etiqueta }) => (
              <th key={campo}>
                <button type="button" className="gg-tabla-orden-boton" onClick={() => ordenarPor(campo)}>
                  {etiqueta}
                  {ordenPor === campo &&
                    (ascendente ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </button>
              </th>
            ))}
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
              <td className="gg-tabla-codigo">
                <CeldaCodigoInterno
                  producto={producto}
                  guardando={guardandoId === producto.id}
                  onGuardar={onGuardarCodigoInterno}
                />
              </td>
              <td className="gg-tabla-nombre">{producto.nombre}</td>
              <td className="gg-tabla-marca">{producto.marcaNombre ?? '—'}</td>
              <td className="gg-tabla-categoria">{producto.categoriaNombre}</td>
              <td>
                <CeldaPrecioCompra
                  producto={producto}
                  guardando={guardandoId === producto.id}
                  onGuardar={onGuardarPrecioCompra}
                />
              </td>
              <td className="gg-tabla-precio-venta">{formatoCOP.format(producto.precioVenta)}</td>
              <td className="gg-tabla-existencias">
                {producto.existencias === 0 ? (
                  <span className="gg-tabla-agotado">Agotado</span>
                ) : (
                  producto.existencias
                )}
              </td>
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
