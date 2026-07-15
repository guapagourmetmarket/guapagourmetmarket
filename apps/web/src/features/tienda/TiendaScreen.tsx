import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Flame, Leaf, Search } from 'lucide-react'
import { Card } from '../../components/Card'
import { obtenerProductosPublico } from '../../lib/api'
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

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ['productos-publico'],
    queryFn: obtenerProductosPublico,
  })

  const categorias = useMemo(() => {
    if (!productos) return []
    return [...new Set(productos.map((p) => p.categoriaNombre))].sort((a, b) => a.localeCompare(b, 'es'))
  }, [productos])

  // Se arma sola con lo que tenga descuento activo: no hay que mantener
  // esta sección a mano, basta con ponerle % de descuento a un producto.
  const ofertas = useMemo(() => {
    if (!productos) return []
    return [...productos]
      .filter((p) => p.descuentoPorcentaje)
      .sort((a, b) => (b.descuentoPorcentaje ?? 0) - (a.descuentoPorcentaje ?? 0))
  }, [productos])

  const productosFiltrados = useMemo(() => {
    if (!productos) return []
    let lista = productos
    if (categoria) lista = lista.filter((p) => p.categoriaNombre === categoria)
    const q = busqueda.trim().toLowerCase()
    if (q) {
      lista = lista.filter((p) =>
        [p.nombre, p.categoriaNombre, p.marcaNombre].filter(Boolean).some((campo) => campo!.toLowerCase().includes(q)),
      )
    }
    return lista
  }, [productos, busqueda, categoria])

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
                    -{producto.descuentoPorcentaje}%
                  </span>
                </div>
                <p className="gg-tienda-oferta-nombre">{producto.nombre}</p>
                <div className="gg-tienda-oferta-precios">
                  <span className="gg-producto-precio-tachado">{formatoCOP.format(producto.precioVenta)}</span>
                  <span className="gg-tienda-oferta-precio-nuevo">
                    {formatoCOP.format(producto.precioOferta ?? producto.precioVenta)}
                  </span>
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
              className={'gg-chip' + (categoria === null ? ' gg-chip--activo' : '')}
              onClick={() => setCategoria(null)}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                className={'gg-chip' + (categoria === c ? ' gg-chip--activo' : '')}
                onClick={() => setCategoria(c)}
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
            <p>No encontramos productos con esa búsqueda.</p>
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="gg-tienda-footer">
        <a href="/enlaces">← Ver todos nuestros enlaces (WhatsApp, redes, reseñas, cómo llegar)</a>
      </footer>
    </div>
  )
}
