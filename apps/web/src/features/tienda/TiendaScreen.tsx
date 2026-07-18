import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Flame, Leaf, Search, ShoppingCart } from 'lucide-react'
import { Card } from '../../components/Card'
import { Marquee } from '../../components/Marquee'
import { obtenerProductosPublico } from '../../lib/api'
import { useCarritoPublico } from '../../lib/carritoPublico'
import { etiquetaPromocion } from '../../lib/precio'
import { brand } from '../../theme/theme'
import '../../components/app-header.css'
import '../productos/productos.css'
import './tienda.css'

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function TiendaScreen() {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [soloDescuentos, setSoloDescuentos] = useState(false)
  const carrito = useCarritoPublico()

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ['productos-publico'],
    queryFn: obtenerProductosPublico,
  })

  const categorias = useMemo(() => {
    if (!productos) return []
    return [...new Set(productos.map((p) => p.categoriaNombre))].sort((a, b) => a.localeCompare(b, 'es'))
  }, [productos])

  // Se arma sola con lo que tenga una promoción activa (% descuento o
  // lleva N paga M): no hay que mantener esta sección a mano, basta con
  // configurar la oferta en el producto. Se ordena por % de ahorro real,
  // para que las promociones más golosas salgan primero sin importar el tipo.
  const ofertas = useMemo(() => {
    if (!productos) return []
    const ahorro = (p: (typeof productos)[number]) =>
      p.promocionN && p.promocionM
        ? (1 - p.promocionM / p.promocionN) * 100
        : (p.descuentoPorcentaje ?? 0)
    return [...productos].filter((p) => etiquetaPromocion(p)).sort((a, b) => ahorro(b) - ahorro(a))
  }, [productos])

  const mensajesTienda = useMemo(
    () =>
      [
        `📍 ${brand.contacto.direccion}`,
        `📞 ${brand.contacto.telefono}`,
        ofertas.length > 0
          ? `🔥 ${ofertas.length} producto${ofertas.length === 1 ? '' : 's'} en oferta ahora mismo`
          : null,
        '🌿 Tu nuevo hábito saludable',
      ].filter((m): m is string => Boolean(m)),
    [ofertas.length],
  )

  const productosFiltrados = useMemo(() => {
    if (!productos) return []
    let lista = productos
    if (soloDescuentos) lista = lista.filter((p) => etiquetaPromocion(p))
    else if (categoria) lista = lista.filter((p) => p.categoriaNombre === categoria)
    const q = busqueda.trim().toLowerCase()
    if (q) {
      lista = lista.filter((p) =>
        [p.nombre, p.categoriaNombre, p.marcaNombre].filter(Boolean).some((campo) => campo!.toLowerCase().includes(q)),
      )
    }
    return lista
  }, [productos, busqueda, categoria, soloDescuentos])

  return (
    <div className="gg-productos-page">
      <header className="gg-header">
        <div className="gg-header-marca">
          <div className="gg-header-marca-fila">
            <img src={brand.logo.hi} alt={brand.name} width={72} height={72} />
            <span className="font-display gg-header-marca-nombre">{brand.name}</span>
          </div>
          <span className="gg-header-marca-autora">by {brand.creator}</span>
          <div className="gg-header-contacto">
            <span className="gg-header-contacto-direccion">{brand.contacto.direccion}</span>
            <a className="gg-header-contacto-item" href={brand.contacto.telefonoHref}>
              {brand.contacto.telefono}
            </a>
          </div>
        </div>
      </header>

      <Marquee items={mensajesTienda} className="gg-marquee--tienda" />

      {ofertas.length > 0 && (
        <section className="gg-tienda-ofertas">
          <h2 className="gg-tienda-ofertas-titulo">
            <Flame size={20} className="gg-tienda-ofertas-icono" />
            Ofertas de hoy
          </h2>
          <div className="gg-tienda-ofertas-scroll">
            {ofertas.map((producto) => (
              <Card key={producto.id} className="gg-tienda-oferta-card">
                <div className="gg-tienda-oferta-imagen">
                  {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  ) : (
                    <Leaf size={28} strokeWidth={1.5} />
                  )}
                  <span className="gg-producto-oferta-badge gg-tienda-oferta-badge-flotante">
                    {producto.promocionN && producto.promocionM
                      ? `${producto.promocionN}x${producto.promocionM}`
                      : `-${producto.descuentoPorcentaje}%`}
                  </span>
                </div>
                <p className="gg-tienda-oferta-nombre">{producto.nombre}</p>
                <div className="gg-tienda-oferta-precios">
                  {producto.promocionN && producto.promocionM ? (
                    <span className="gg-tienda-oferta-precio-nuevo">
                      {formatoCOP.format(producto.precioVenta)}{' '}
                      <span className="gg-tienda-oferta-nxm-texto">
                        · lleva {producto.promocionN}, paga {producto.promocionM}
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="gg-producto-precio-tachado">{formatoCOP.format(producto.precioVenta)}</span>
                      <span className="gg-tienda-oferta-precio-nuevo">
                        {formatoCOP.format(producto.precioOferta ?? producto.precioVenta)}
                      </span>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <main className="gg-productos-main">
        <div className="gg-productos-toolbar">
          <h1 className="font-display gg-productos-title">Nuestros productos</h1>
          <div className="gg-search">
            <Search size={18} className="gg-search-icon" />
            <input
              type="search"
              className="gg-search-input"
              placeholder="Buscar por nombre, marca o categoría…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar productos"
            />
          </div>
        </div>

        <div className="gg-productos-filtros">
          <div className="gg-categorias-chips">
            <button
              type="button"
              className={'gg-chip' + (categoria === null && !soloDescuentos ? ' gg-chip--activo' : '')}
              onClick={() => {
                setCategoria(null)
                setSoloDescuentos(false)
              }}
            >
              Todas
            </button>
            {ofertas.length > 0 && (
              <button
                type="button"
                className={'gg-chip gg-chip--descuento' + (soloDescuentos ? ' gg-chip--activo' : '')}
                onClick={() => {
                  setSoloDescuentos((v) => !v)
                  setCategoria(null)
                }}
              >
                <Flame size={13} />
                Descuentos ({ofertas.length})
              </button>
            )}
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                className={'gg-chip' + (categoria === c && !soloDescuentos ? ' gg-chip--activo' : '')}
                onClick={() => {
                  setCategoria(c)
                  setSoloDescuentos(false)
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <Card className="gg-productos-estado">
            <p>Cargando productos…</p>
          </Card>
        )}

        {isError && (
          <Card className="gg-productos-estado">
            <p>No pudimos cargar los productos. Intenta de nuevo en un momento.</p>
          </Card>
        )}

        {!isLoading && !isError && productosFiltrados.length === 0 && (
          <Card className="gg-productos-estado">
            <p>
              {soloDescuentos
                ? 'No hay productos con descuento activo en este momento.'
                : 'No encontramos productos con esa búsqueda.'}
            </p>
          </Card>
        )}

        {!isLoading && !isError && productosFiltrados.length > 0 && (
          <div className="gg-productos-grid">
            {productosFiltrados.map((producto) => (
              <Card key={producto.id} className="gg-producto-card">
                <div className="gg-producto-imagen">
                  {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  ) : (
                    <Leaf size={32} strokeWidth={1.5} />
                  )}
                </div>
                <div className="gg-producto-info">
                  <p className="gg-producto-categoria">{producto.categoriaNombre}</p>
                  <h2 className="gg-producto-nombre">{producto.nombre}</h2>
                  {producto.marcaNombre && <p className="gg-producto-marca">{producto.marcaNombre}</p>}
                  {producto.descuentoPorcentaje && (
                    <span className="gg-producto-oferta-badge">-{producto.descuentoPorcentaje}% OFERTA</span>
                  )}
                  {producto.promocionN && producto.promocionM && (
                    <span className="gg-producto-oferta-badge">
                      {producto.promocionN}x{producto.promocionM} OFERTA
                    </span>
                  )}
                  <div className="gg-producto-footer">
                    {producto.descuentoPorcentaje ? (
                      <span className="gg-producto-precio">
                        <span className="gg-producto-precio-tachado">
                          {formatoCOP.format(producto.precioVenta)}
                        </span>{' '}
                        {formatoCOP.format(producto.precioOferta ?? producto.precioVenta)}
                      </span>
                    ) : (
                      <span className="gg-producto-precio">{formatoCOP.format(producto.precioVenta)}</span>
                    )}
                    <span className={'gg-producto-stock' + (producto.disponible ? '' : ' gg-producto-stock--agotado')}>
                      {producto.disponible ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="gg-tienda-agregar-boton"
                    disabled={!producto.disponible}
                    onClick={() => carrito.agregarProducto(producto)}
                  >
                    <ShoppingCart size={15} />
                    Agregar al pedido
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="gg-tienda-footer">
        <a href="/enlaces">← Ver todos nuestros enlaces (WhatsApp, redes, reseñas, cómo llegar)</a>
      </footer>

      {carrito.lineas.length > 0 && (
        <Link to="/tienda/pedido" className="gg-carrito-flotante">
          <ShoppingCart size={18} />
          <span>
            {carrito.totalUnidades} producto{carrito.totalUnidades === 1 ? '' : 's'} · {formatoCOP.format(carrito.total)}
          </span>
          <span className="gg-carrito-flotante-cta">Ver pedido</span>
        </Link>
      )}
    </div>
  )
}
