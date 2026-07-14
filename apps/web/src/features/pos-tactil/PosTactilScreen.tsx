import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Leaf, Search, ShoppingCart, Star } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { useCarrito } from '../../lib/carrito'
import { obtenerProductos } from '../../lib/api'
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
  const { data: negocio } = useQuery({ queryKey: ['negocio'], queryFn: obtenerNegocio })
  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ['productos'],
    queryFn: () => obtenerProductos(false),
  })

  const [busqueda, setBusqueda] = useState('')
  const [cobrando, setCobrando] = useState(false)
  const [reciboVenta, setReciboVenta] = useState<Venta | null>(null)

  const favoritos = useMemo(
    () => (productos ?? []).filter((p) => p.favoritoPos && p.activo !== false),
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

  function agregarYLimpiar(producto: (typeof favoritos)[number]) {
    carrito.agregarProducto(producto)
    setBusqueda('')
  }

  return (
    <div className="gg-tactil-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-tactil-main">
        <div className="gg-tactil-buscar">
          <Search size={20} className="gg-tactil-buscar-icono" />
          <input
            type="search"
            className="gg-tactil-buscar-input"
            placeholder="Buscar o escanear un producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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
                      {formatoCOP.format(producto.precioVenta)}
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

            {!isLoading && !isError && favoritos.length === 0 && (
              <Card className="gg-tactil-estado gg-tactil-estado-vacio">
                <Star size={32} strokeWidth={1.5} />
                <p>
                  Todavía no marcaste ningún producto como favorito del modo táctil. Ve a{' '}
                  <Link to="/productos">Productos</Link> y toca la estrella <Star size={14} /> en
                  los que más vendas para que aparezcan aquí, grandes y con foto.
                </p>
              </Card>
            )}

            {!isLoading && !isError && favoritos.length > 0 && (
              <div className="gg-tactil-grid">
                {favoritos.map((producto) => (
                  <button
                    key={producto.id}
                    type="button"
                    className="gg-tactil-tile"
                    disabled={producto.existencias === 0}
                    onClick={() => carrito.agregarProducto(producto)}
                  >
                    <div className="gg-tactil-tile-imagen">
                      {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} />
                      ) : (
                        <Leaf size={40} strokeWidth={1.5} />
                      )}
                      {producto.existencias === 0 && (
                        <span className="gg-tactil-agotado gg-tactil-agotado--tile">Agotado</span>
                      )}
                    </div>
                    <div className="gg-tactil-tile-info">
                      <span className="gg-tactil-tile-nombre">{producto.nombre}</span>
                      <span className="gg-tactil-tile-precio">
                        {formatoCOP.format(producto.precioVenta)}
                      </span>
                    </div>
                  </button>
                ))}
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
