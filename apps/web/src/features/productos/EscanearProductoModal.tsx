import { useMemo, useRef, useState } from 'react'
import { Leaf, ScanLine, Search } from 'lucide-react'
import type { Producto } from '@guapa/shared'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { EscanearCamara, type EscanearCamaraHandle } from '../../components/EscanearCamara'
import { AgregarProductoLibre } from '../ventas/AgregarProductoLibre'
import { precioEfectivo } from '../../lib/precio'
import './escanear-producto-modal.css'

interface EscanearProductoModalProps {
  productos: Producto[]
  onEncontrado: (producto: Producto) => void
  onAgregarLibre: (nombre: string, precio: number) => void
  onClose: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/**
 * Escanear con la cámara del computador o celular para identificar un
 * producto ya cargado — mismo lector que usa la tienda pública. También
 * deja buscar por nombre, para los productos que no tienen código de
 * barras/QR y por eso no se pueden escanear.
 */
export function EscanearProductoModal({
  productos,
  onEncontrado,
  onAgregarLibre,
  onClose,
}: EscanearProductoModalProps) {
  const camaraRef = useRef<EscanearCamaraHandle>(null)
  const [codigoSinMatch, setCodigoSinMatch] = useState('')
  const [busqueda, setBusqueda] = useState('')

  function manejarDetectado(codigo: string) {
    const encontrado = productos.find((p) => p.codigoBarras === codigo || p.codigoInterno === codigo)
    if (encontrado) {
      onEncontrado(encontrado)
    } else {
      setCodigoSinMatch(codigo)
    }
  }

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return []
    return productos
      .filter((p) => p.activo !== false)
      .filter((p) =>
        [p.nombre, p.categoriaNombre, p.marcaNombre, p.codigoInterno]
          .filter(Boolean)
          .some((campo) => campo!.toLowerCase().includes(q)),
      )
      .slice(0, 8)
  }, [productos, busqueda])

  return (
    <Modal title="Escanear producto" onClose={onClose}>
      <EscanearCamara ref={camaraRef} onDetectado={manejarDetectado} />

      {codigoSinMatch && (
        <div className="gg-escanear-no-encontrado">
          <ScanLine size={22} />
          <p>No encontramos ningún producto con el código "{codigoSinMatch}".</p>
          <Button
            type="button"
            onClick={() => {
              setCodigoSinMatch('')
              camaraRef.current?.reanudar()
            }}
          >
            Seguir escaneando
          </Button>
        </div>
      )}

      <div className="gg-escanear-buscar">
        <Search size={16} className="gg-escanear-buscar-icono" />
        <input
          type="search"
          className="gg-input gg-escanear-buscar-input"
          placeholder="¿No tiene código? Busca el producto por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {resultadosBusqueda.length > 0 && (
        <ul className="gg-escanear-resultados">
          {resultadosBusqueda.map((producto) => (
            <li key={producto.id}>
              <button
                type="button"
                className="gg-escanear-resultado"
                onClick={() => {
                  setBusqueda('')
                  onEncontrado(producto)
                }}
              >
                <div className="gg-escanear-resultado-imagen">
                  {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  ) : (
                    <Leaf size={18} strokeWidth={1.5} />
                  )}
                </div>
                <div className="gg-escanear-resultado-info">
                  <span className="gg-escanear-resultado-nombre">{producto.nombre}</span>
                  <span className="gg-escanear-resultado-precio">
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
          setBusqueda('')
          onAgregarLibre(nombre, precio)
        }}
      />
    </Modal>
  )
}
