import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Leaf, Minus, Pencil, Power, Search, ShoppingCart, Star, Trash2 } from 'lucide-react'
import type { Producto } from '@guapa/shared'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { useCarrito } from '../../lib/carrito'
import { precioEfectivo } from '../../lib/precio'
import { useConfirm } from '../../lib/confirm'
import { useEscaneoCodigoBarras } from '../../lib/useEscaneoCodigoBarras'
import {
  ApiError,
  cambiarEstadoProducto,
  cambiarFavoritoProducto,
  eliminarProducto,
  obtenerProductos,
} from '../../lib/api'
import { CobrarModal } from '../ventas/CobrarModal'
import { ReciboModal } from '../ventas/ReciboModal'
import { obtenerNegocio, type Venta } from '../../lib/api'
import '../productos/productos.css'
import './pos-tactil.css'

interface PosTactilScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function PosTactilScreen({ onCerrarSesion }: PosTactilScreenProps) {
  const carrito = useCarrito()
  const confirmar = useConfirm()
  const queryClient = useQueryClient()
  const { data: negocio } = useQuery({ queryKey: ['negocio'], queryFn: obtenerNegocio })
  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ['productos'],
    queryFn: () => obtenerProductos(false),
  })

  const [busqueda, setBusqueda] = useState('')
  const [cobrando, setCobrando] = useState(false)
  const [reciboVenta, setReciboVenta] = useState<Venta | null>(null)

  const mutacionEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => cambiarEstadoProducto(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  })

  const mutacionFavorito = useMutation({
    mutationFn: ({ id, favoritoPos }: { id: string; favoritoPos: boolean }) =>
      cambiarFavoritoProducto(id, favoritoPos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  })

  const mutacionEliminar = useMutation({
    mutationFn: eliminarProducto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
    onError: (err) => {
      window.alert(err instanceof ApiError ? err.message : 'No pudimos eliminar el producto. Intenta de nuevo.')
    },
  })

  // Todos los productos activos, no solo los favoritos: los favoritos
  // simplemente aparecen primero, para que nada quede escondido en modo
  // táctil, pero los que más se venden sigan siendo los más a mano.
  const productosGrid = useMemo(
    () =>
      (productos ?? [])
        .filter((p) => p.activo !== false)
        .sort((a, b) => Number(b.favoritoPos) - Number(a.favoritoPos) || a.nombre.localeCompare(b.nombre)),
    [productos],
  )

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q || !productos) return []
    return productos
      .filter((p) => p.activo !== false)
      .filter((p) =>
        [p.nombre, p.categoriaNombre, p.marcaNombre, p.codigoInterno, p.codigoBarras]
          .filter(Boolean)
          .some((campo) => campo!.toLowerCase().includes(q)),
      )
      .slice(0, 12)
  }, [productos, busqueda])

  function agregarYLimpiar(producto: Producto) {
    carrito.agregarProducto(producto)
    setBusqueda('')
  }

  // El lector USB escribe el código rápido y termina en Enter: si coincide
  // exacto con un producto, se agrega solo al carrito sin necesidad de
  // tocar la pantalla — igual que en Venta manual.
  function manejarEscaneo(codigo: string) {
    const exacto = (productos ?? []).find(
      (p) => p.activo !== false && (p.codigoBarras === codigo || p.codigoInterno === codigo),
    )
    if (exacto) {
      agregarYLimpiar(exacto)
      return
    }
    setBusqueda(codigo)
  }

  const { inputRef, handleKeyDown } = useEscaneoCodigoBarras(manejarEscaneo)

  async function handleEliminar(producto: Producto) {
    const confirmado = await confirmar(
      `¿Eliminar "${producto.nombre}" para siempre? Esta acción no se puede deshacer. Si prefieres poder recuperarlo más adelante, usa "Desactivar" en su lugar.`,
      { peligro: true, textoConfirmar: 'Eliminar para siempre' },
    )
    if (confirmado) mutacionEliminar.mutate(producto.id)
  }

  async function handleDesactivar(producto: Producto) {
    const confirmado = await confirmar(
      `¿Desactivar "${producto.nombre}"? Deja de aparecer aquí y en Productos, pero puedes reactivarlo cuando quieras.`,
      { peligro: true, textoConfirmar: 'Desactivar' },
    )
    if (confirmado) mutacionEstado.mutate({ id: producto.id, activo: false })
  }

  return (
    <div className="gg-tactil-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-tactil-main">
        <div className="gg-tactil-buscar">
          <Search size={20} className="gg-tactil-buscar-icono" />
          <input
            ref={inputRef}
            type="search"
            className="gg-tactil-buscar-input"
            placeholder="Buscar o escanear un producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {busqueda.trim() !== '' ? (
          <div className="gg-tactil-resultados">
            {resultadosBusqueda.length === 0 ? (
              <Card className="gg-tactil-estado">
                <p>No encontramos productos con esa búsqueda.</p>
              </Card>
            ) : (
              resultadosBusqueda.map((producto) => (
                <button
                  key={producto.id}
                  type="button"
                  className="gg-tactil-resultado"
                  disabled={producto.existencias === 0}
                  onClick={() => agregarYLimpiar(producto)}
                >
                  <div className="gg-tactil-resultado-imagen">
                    {producto.imagenUrl ? (
                      <img src={producto.imagenUrl} alt={producto.nombre} />
                    ) : (
                      <Leaf size={22} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="gg-tactil-resultado-info">
                    <span className="gg-tactil-resultado-nombre">{producto.nombre}</span>
                    <span className="gg-tactil-resultado-precio">
                      {formatoCOP.format(precioEfectivo(producto))}
                      {producto.descuentoPorcentaje && (
                        <span className="gg-tactil-oferta-badge">-{producto.descuentoPorcentaje}%</span>
                      )}
                      {producto.promocionN && producto.promocionM && (
                        <span className="gg-tactil-oferta-badge">
                          {producto.promocionN}x{producto.promocionM}
                        </span>
                      )}
                    </span>
                  </div>
                  {producto.existencias === 0 && (
                    <span className="gg-tactil-agotado">Agotado</span>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {isLoading && (
              <Card className="gg-tactil-estado">
                <p>Cargando productos…</p>
              </Card>
            )}

            {isError && (
              <Card className="gg-tactil-estado">
                <p>No pudimos cargar los productos. Verifica que la API esté encendida.</p>
              </Card>
            )}

            {!isLoading && !isError && productosGrid.length === 0 && (
              <Card className="gg-tactil-estado gg-tactil-estado-vacio">
                <Star size={32} strokeWidth={1.5} />
                <p>
                  Todavía no tienes productos activos. Ve a{' '}
                  <Link to="/productos">Productos</Link> para agregar el primero.
                </p>
              </Card>
            )}

            {!isLoading && !isError && productosGrid.length > 0 && (
              <div className="gg-tactil-grid">
                {productosGrid.map((producto) => {
                  const linea = carrito.lineas.find((l) => l.producto.id === producto.id)
                  return (
                    <Card key={producto.id} className="gg-tactil-tile">
                      <button
                        type="button"
                        className="gg-tactil-tile-tap"
                        disabled={producto.existencias === 0}
                        onClick={() => carrito.agregarProducto(producto)}
                      >
                        <div className="gg-tactil-tile-imagen">
                          {producto.imagenUrl ? (
                            <img src={producto.imagenUrl} alt={producto.nombre} />
                          ) : (
                            <Leaf size={40} strokeWidth={1.5} />
                          )}
                          {producto.favoritoPos && (
                            <span className="gg-tactil-favorito-badge">
                              <Star size={11} fill="currentColor" />
                            </span>
                          )}
                          {producto.existencias === 0 && (
                            <span className="gg-tactil-agotado gg-tactil-agotado--tile">Agotado</span>
                          )}
                        </div>
                        <div className="gg-tactil-tile-info">
                          <span className="gg-tactil-tile-nombre">{producto.nombre}</span>
                          <span className="gg-tactil-tile-precio">
                            {producto.descuentoPorcentaje && (
                              <span className="gg-tactil-tile-precio-tachado">
                                {formatoCOP.format(producto.precioVenta)}
                              </span>
                            )}
                            {formatoCOP.format(precioEfectivo(producto))}
                          </span>
                          {producto.descuentoPorcentaje && (
                            <span className="gg-tactil-oferta-badge">-{producto.descuentoPorcentaje}%</span>
                          )}
                          {producto.promocionN && producto.promocionM && (
                            <span className="gg-tactil-oferta-badge">
                              {producto.promocionN}x{producto.promocionM}
                            </span>
                          )}
                        </div>
                      </button>

                      {linea && (
                        <div className="gg-tactil-tile-cantidad">
                          <button
                            type="button"
                            title="Quitar una unidad del carrito"
                            onClick={() => carrito.cambiarCantidad(producto.id, -1)}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{linea.cantidad}</span>
                          <span className="gg-tactil-tile-cantidad-label">en el carrito</span>
                        </div>
                      )}

                      <div className="gg-tactil-tile-acciones">
                        <Link
                          to={`/productos/${producto.id}/editar`}
                          className="gg-producto-accion"
                          title="Editar producto"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          className={
                            'gg-producto-accion' + (producto.favoritoPos ? ' gg-producto-accion--favorito' : '')
                          }
                          title={producto.favoritoPos ? 'Quitar de favoritos' : 'Marcar como favorito'}
                          disabled={mutacionFavorito.isPending}
                          onClick={() =>
                            mutacionFavorito.mutate({ id: producto.id, favoritoPos: !producto.favoritoPos })
                          }
                        >
                          <Star size={14} fill={producto.favoritoPos ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          className="gg-producto-accion"
                          title="Desactivar producto (se puede reactivar luego)"
                          disabled={mutacionEstado.isPending}
                          onClick={() => handleDesactivar(producto)}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          type="button"
                          className="gg-producto-accion gg-producto-accion--peligro"
                          title="Eliminar producto para siempre"
                          disabled={mutacionEliminar.isPending}
                          onClick={() => handleEliminar(producto)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {carrito.lineas.length > 0 && (
        <button type="button" className="gg-carrito-flotante" onClick={() => setCobrando(true)}>
          <ShoppingCart size={18} />
          <span>
            {carrito.lineas.length} producto{carrito.lineas.length === 1 ? '' : 's'} en el
            carrito · {formatoCOP.format(carrito.total)}
          </span>
          <span className="gg-carrito-flotante-cta">Cobrar</span>
        </button>
      )}

      {cobrando && (
        <CobrarModal
          onClose={() => setCobrando(false)}
          onVentaRegistrada={(venta) => {
            setCobrando(false)
            setReciboVenta(venta)
          }}
        />
      )}

      {reciboVenta && (
        <ReciboModal venta={reciboVenta} negocio={negocio} onClose={() => setReciboVenta(null)} />
      )}
    </div>
  )
}
