import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Barcode, Copy, Download, FileText, Flame, Leaf, Pencil, Plus, Power, ScanLine, Settings, ShoppingCart, Search, Star, Trash2, Upload } from 'lucide-react'
import type { Producto } from '@guapa/shared'
import { Card } from '../../components/Card'
import { SkeletonTarjetas } from '../../components/Skeleton'
import { Button } from '../../components/Button'
import { AppHeader } from '../../components/AppHeader'
import { DetalleProductoModal } from '../../components/DetalleProductoModal'
import { useCarrito } from '../../lib/carrito'
import { etiquetaPromocion } from '../../lib/precio'
import {
  ApiError,
  cambiarEstadoProducto,
  cambiarFavoritoProducto,
  descargarCatalogoPdf,
  duplicarProducto,
  eliminarProducto,
  exportarProductos,
  obtenerNegocio,
  obtenerProductos,
  type Venta,
} from '../../lib/api'
import { CobrarModal } from '../ventas/CobrarModal'
import { CuentaViva } from '../ventas/CuentaViva'
import { useConfirm } from '../../lib/confirm'
import { ReciboModal } from '../ventas/ReciboModal'
import { ImportarModal } from './ImportarModal'
import { EscanearProductoModal } from './EscanearProductoModal'
import { GestionCategoriasModal } from './GestionCategoriasModal'
import { EtiquetaModal } from './EtiquetaModal'
import './productos.css'

interface ProductosScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function ProductosScreen({ onCerrarSesion }: ProductosScreenProps) {
  const queryClient = useQueryClient()
  const confirmar = useConfirm()
  const carrito = useCarrito()

  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [soloDescuentos, setSoloDescuentos] = useState(false)
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false)
  const [cobrando, setCobrando] = useState(false)
  const [reciboVenta, setReciboVenta] = useState<Venta | null>(null)
  const [importando, setImportando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [generandoCatalogo, setGenerandoCatalogo] = useState(false)
  const [gestionandoCategorias, setGestionandoCategorias] = useState(false)
  const [etiquetaProducto, setEtiquetaProducto] = useState<Producto | null>(null)
  const [detalleProducto, setDetalleProducto] = useState<Producto | null>(null)
  const [escaneando, setEscaneando] = useState(false)

  const { data: negocio } = useQuery({ queryKey: ['negocio'], queryFn: obtenerNegocio })

  const {
    data: productos,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['productos', mostrarDesactivados],
    queryFn: () => obtenerProductos(mostrarDesactivados),
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      cambiarEstadoProducto(id, activo),
    onSuccess: (_producto, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      // Al desactivar, se enciende "Mostrar desactivados" para que el producto
      // se quede visible ahí mismo (atenuado, con su etiqueta) en vez de
      // desaparecer sin explicación — así se ve claro que sigue existiendo y
      // dónde volver a activarlo.
      if (variables.activo === false) setMostrarDesactivados(true)
    },
  })

  const mutacionFavorito = useMutation({
    mutationFn: ({ id, favoritoPos }: { id: string; favoritoPos: boolean }) =>
      cambiarFavoritoProducto(id, favoritoPos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  })

  const mutacionDuplicar = useMutation({
    mutationFn: duplicarProducto,
    onSuccess: () => {
      // Se queda en la lista (no entra al formulario) para que "Duplicar" se
      // sienta distinto de "Editar": crea una copia ahí mismo, lista para
      // ajustarla cuando quieras.
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })

  const mutacionEliminar = useMutation({
    mutationFn: eliminarProducto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
    onError: (err) => {
      window.alert(
        err instanceof ApiError ? err.message : 'No pudimos eliminar el producto. Intenta de nuevo.',
      )
    },
  })

  const categorias = useMemo(() => {
    if (!productos) return []
    const mapa = new Map<string, string>()
    for (const p of productos) mapa.set(p.categoriaId, p.categoriaNombre)
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [productos])

  const totalDescuentos = useMemo(
    () => (productos ?? []).filter((p) => etiquetaPromocion(p)).length,
    [productos],
  )

  const productosFiltrados = useMemo(() => {
    if (!productos) return []
    let lista = productos
    if (soloDescuentos) lista = lista.filter((p) => etiquetaPromocion(p))
    else if (categoriaId) lista = lista.filter((p) => p.categoriaId === categoriaId)
    const q = busqueda.trim().toLowerCase()
    if (q) {
      lista = lista.filter((p) =>
        [p.nombre, p.categoriaNombre, p.marcaNombre, p.codigoInterno, p.codigoBarras]
          .filter(Boolean)
          .some((campo) => campo!.toLowerCase().includes(q)),
      )
    }
    return lista
  }, [productos, busqueda, categoriaId, soloDescuentos])

  async function handleDesactivar(id: string, nombre: string) {
    const confirmado = await confirmar(
      `¿Desactivar "${nombre}"? Dejará de aparecer en la tienda, pero puedes volver a activarlo cuando quieras y su historial de ventas se conserva.`,
      { peligro: true, textoConfirmar: 'Desactivar' },
    )
    if (confirmado) mutacionEstado.mutate({ id, activo: false })
  }

  async function handleEliminar(id: string, nombre: string) {
    const confirmado = await confirmar(
      `¿Eliminar "${nombre}" para siempre? Esta acción no se puede deshacer. Si prefieres poder recuperarlo más adelante, usa "Desactivar" en su lugar.`,
      { peligro: true, textoConfirmar: 'Eliminar para siempre' },
    )
    if (confirmado) mutacionEliminar.mutate(id)
  }

  return (
    <div className="gg-productos-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-productos-main">
        <div className="gg-productos-toolbar">
          <h1 className="font-display gg-productos-title">Productos</h1>
          <div className="gg-search">
            <Search size={18} className="gg-search-icon" />
            <input
              type="search"
              className="gg-search-input"
              placeholder="Buscar por nombre, código, marca o categoría…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar productos"
            />
          </div>
          <div className="gg-productos-toolbar-acciones">
            <Button
              type="button"
              variant="secondary"
              disabled={exportando}
              onClick={async () => {
                setExportando(true)
                try {
                  await exportarProductos()
                } finally {
                  setExportando(false)
                }
              }}
            >
              <Download size={18} />
              {exportando ? 'Exportando…' : 'Exportar'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setImportando(true)}>
              <Upload size={18} />
              Importar
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEscaneando(true)}>
              <ScanLine size={18} />
              Escanear
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={generandoCatalogo}
              onClick={async () => {
                setGenerandoCatalogo(true)
                try {
                  await descargarCatalogoPdf()
                } finally {
                  setGenerandoCatalogo(false)
                }
              }}
            >
              <FileText size={18} />
              {generandoCatalogo ? 'Generando…' : 'Catálogo PDF'}
            </Button>
            <Link to="/productos/nuevo">
              <Button type="button">
                <Plus size={18} />
                Nuevo producto
              </Button>
            </Link>
          </div>
        </div>

        <div className="gg-productos-filtros">
          <div className="gg-categorias-chips">
            <button
              type="button"
              className={'gg-chip' + (categoriaId === null && !soloDescuentos ? ' gg-chip--activo' : '')}
              onClick={() => {
                setCategoriaId(null)
                setSoloDescuentos(false)
              }}
            >
              Todas
            </button>
            {totalDescuentos > 0 && (
              <button
                type="button"
                className={'gg-chip gg-chip--descuento' + (soloDescuentos ? ' gg-chip--activo' : '')}
                onClick={() => {
                  setSoloDescuentos((v) => !v)
                  setCategoriaId(null)
                }}
              >
                <Flame size={13} />
                Descuentos ({totalDescuentos})
              </button>
            )}
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                className={'gg-chip' + (categoriaId === c.id && !soloDescuentos ? ' gg-chip--activo' : '')}
                onClick={() => {
                  setCategoriaId(c.id)
                  setSoloDescuentos(false)
                }}
              >
                {c.nombre}
              </button>
            ))}
          </div>
          <div className="gg-productos-filtros-derecha">
            <button
              type="button"
              className="gg-gestion-categorias-boton"
              onClick={() => setGestionandoCategorias(true)}
            >
              <Settings size={14} />
              Categorías y marcas
            </button>
            <label className="gg-toggle-desactivados">
              <input
                type="checkbox"
                checked={mostrarDesactivados}
                onChange={(e) => setMostrarDesactivados(e.target.checked)}
              />
              Mostrar desactivados
            </label>
          </div>
        </div>

        {isLoading && <SkeletonTarjetas />}

        {isError && (
          <Card className="gg-productos-estado">
            <p>No pudimos cargar los productos. Verifica que la API esté encendida.</p>
          </Card>
        )}

        {!isLoading && !isError && productosFiltrados.length === 0 && (
          <Card className="gg-productos-estado">
            <p>
              {soloDescuentos
                ? 'No tienes productos con descuento activo en este momento.'
                : 'No encontramos productos con esa búsqueda.'}
            </p>
          </Card>
        )}

        {!isLoading && !isError && productosFiltrados.length > 0 && (
          <div className="gg-productos-grid">
            {productosFiltrados.map((producto) => (
              <Card
                key={producto.id}
                className={'gg-producto-card' + (producto.activo === false ? ' gg-producto-card--inactivo' : '')}
              >
                <div
                  className="gg-producto-clicable"
                  onClick={() => setDetalleProducto(producto)}
                  title="Ver foto y descripción completas"
                >
                  <div className="gg-producto-imagen">
                    {producto.imagenUrl ? (
                      <img src={producto.imagenUrl} alt={producto.nombre} />
                    ) : (
                      <Leaf size={32} strokeWidth={1.5} />
                    )}
                    {producto.activo === false && (
                      <span className="gg-producto-badge-inactivo">Desactivado</span>
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
                      <span
                        className={
                          'gg-producto-stock' +
                          (producto.existencias === 0
                            ? ' gg-producto-stock--agotado'
                            : producto.existencias <= (producto.stockMinimo ?? 0)
                              ? ' gg-producto-stock--bajo'
                              : '')
                        }
                      >
                        {producto.existencias === 0
                          ? 'Agotado'
                          : producto.vendePorPeso
                            ? `${producto.existencias} ${producto.unidadMedida} en stock`
                            : `${producto.existencias} en stock`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="gg-producto-acciones">
                  <button
                    type="button"
                    className="gg-producto-accion"
                    title="Agregar al carrito de venta"
                    disabled={producto.existencias === 0 || producto.activo === false}
                    onClick={() => carrito.agregarProducto(producto)}
                  >
                    <ShoppingCart size={16} />
                  </button>
                  <button
                    type="button"
                    className="gg-producto-accion"
                    title="Imprimir etiqueta con código de barras"
                    onClick={() => setEtiquetaProducto(producto)}
                  >
                    <Barcode size={16} />
                  </button>
                  <Link
                    to={`/productos/${producto.id}/editar`}
                    className="gg-producto-accion"
                    title="Editar producto"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    className="gg-producto-accion"
                    title="Crear una copia de este producto (queda en la lista, sin salir de aquí)"
                    disabled={mutacionDuplicar.isPending}
                    onClick={() => mutacionDuplicar.mutate(producto.id)}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    className={
                      'gg-producto-accion' +
                      (producto.favoritoPos ? ' gg-producto-accion--favorito' : '')
                    }
                    title={
                      producto.favoritoPos
                        ? 'Quitar de favoritos del modo táctil'
                        : 'Marcar como favorito del modo táctil (aparece grande, con foto, para vender tocando)'
                    }
                    disabled={mutacionFavorito.isPending}
                    onClick={() =>
                      mutacionFavorito.mutate({ id: producto.id, favoritoPos: !producto.favoritoPos })
                    }
                  >
                    <Star size={16} fill={producto.favoritoPos ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="gg-producto-accion"
                    title={
                      producto.activo === false
                        ? 'Reactivar producto (volver a mostrarlo en la tienda)'
                        : 'Desactivar producto por un tiempo (se puede reactivar luego)'
                    }
                    onClick={() =>
                      producto.activo === false
                        ? mutacionEstado.mutate({ id: producto.id, activo: true })
                        : handleDesactivar(producto.id, producto.nombre)
                    }
                  >
                    <Power size={16} />
                  </button>
                  <button
                    type="button"
                    className="gg-producto-accion gg-producto-accion--peligro"
                    title="Eliminar producto para siempre (no se puede deshacer)"
                    disabled={mutacionEliminar.isPending}
                    onClick={() => handleEliminar(producto.id, producto.nombre)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CuentaViva onCobrar={() => setCobrando(true)} />

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

      {importando && <ImportarModal onClose={() => setImportando(false)} />}
      {escaneando && (
        <EscanearProductoModal
          productos={productos ?? []}
          onClose={() => setEscaneando(false)}
          onEncontrado={(producto) => {
            setEscaneando(false)
            setDetalleProducto(producto)
          }}
        />
      )}
      {gestionandoCategorias && (
        <GestionCategoriasModal onClose={() => setGestionandoCategorias(false)} />
      )}
      {etiquetaProducto && (
        <EtiquetaModal producto={etiquetaProducto} onClose={() => setEtiquetaProducto(null)} />
      )}
      {detalleProducto && (
        <DetalleProductoModal
          producto={detalleProducto}
          onClose={() => setDetalleProducto(null)}
          onAgregar={
            detalleProducto.existencias > 0 && detalleProducto.activo !== false
              ? () => {
                  carrito.agregarProducto(detalleProducto)
                  setDetalleProducto(null)
                }
              : undefined
          }
          textoAgregar="Agregar al carrito"
        />
      )}
    </div>
  )
}
