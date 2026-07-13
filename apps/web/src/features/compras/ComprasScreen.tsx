import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Loader2, Minus, Plus, PackageSearch, ReceiptText, Search, Trash2 } from 'lucide-react'
import type { Producto } from '@guapa/shared'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  ApiError,
  anularCompra,
  buscarProductos,
  obtenerCompras,
  obtenerProveedores,
  registrarCompra,
  type MetodoPagoCompra,
} from '../../lib/api'
import './compras.css'

interface ComprasScreenProps {
  onCerrarSesion: () => void
}

interface LineaCompra {
  producto: Producto
  cantidad: number
  costoUnitario: number
  lote: string
  fechaVencimiento: string
}

const METODOS_PAGO: { value: MetodoPagoCompra; label: string }[] = [
  { value: 'contado', label: 'Contado' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito', label: 'Crédito' },
]

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const hoy = () => new Date().toISOString().slice(0, 10)

const formatoFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function ComprasScreen({ onCerrarSesion }: ComprasScreenProps) {
  const queryClient = useQueryClient()

  const { data: proveedores } = useQuery({ queryKey: ['proveedores'], queryFn: () => obtenerProveedores() })
  const {
    data: compras,
    isLoading: cargandoCompras,
    isError: errorCompras,
  } = useQuery({ queryKey: ['compras'], queryFn: obtenerCompras })

  const [proveedorId, setProveedorId] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [numeroFactura, setNumeroFactura] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPagoCompra>('contado')
  const [fechaVencimientoPago, setFechaVencimientoPago] = useState('')
  const [notas, setNotas] = useState('')
  const [termino, setTermino] = useState('')
  const [lineas, setLineas] = useState<LineaCompra[]>([])
  const [error, setError] = useState('')
  const [anulando, setAnulando] = useState<string | null>(null)

  const { data: sugerencias } = useQuery({
    queryKey: ['productos', 'buscar', termino],
    queryFn: () => buscarProductos(termino),
    enabled: termino.trim().length >= 2,
  })

  function agregarProducto(producto: Producto) {
    setLineas((prev) => {
      if (prev.some((l) => l.producto.id === producto.id)) return prev
      return [
        ...prev,
        { producto, cantidad: 1, costoUnitario: producto.costoPromedio || producto.precioCompra || 0, lote: '', fechaVencimiento: '' },
      ]
    })
    setTermino('')
  }

  function actualizarLinea(productoId: string, cambios: Partial<LineaCompra>) {
    setLineas((prev) => prev.map((l) => (l.producto.id === productoId ? { ...l, ...cambios } : l)))
  }

  function quitarLinea(productoId: string) {
    setLineas((prev) => prev.filter((l) => l.producto.id !== productoId))
  }

  const total = lineas.reduce((acc, l) => acc + l.cantidad * l.costoUnitario, 0)

  const mutacion = useMutation({
    mutationFn: registrarCompra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setLineas([])
      setNumeroFactura('')
      setNotas('')
      setMetodoPago('contado')
      setFechaVencimientoPago('')
      setFecha(hoy())
      setError('')
    },
  })

  const mutacionAnular = useMutation({
    mutationFn: anularCompra,
    onMutate: (id) => setAnulando(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    onSettled: () => setAnulando(null),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!proveedorId) {
      setError('Elige el proveedor de esta compra.')
      return
    }
    if (lineas.length === 0) {
      setError('Agrega al menos un producto.')
      return
    }
    if (lineas.some((l) => l.costoUnitario <= 0)) {
      setError('Todos los productos deben tener un costo mayor a cero.')
      return
    }
    if (metodoPago === 'credito' && !fechaVencimientoPago) {
      setError('Indica la fecha en que vence el pago a crédito.')
      return
    }

    mutacion.mutate({
      proveedorId,
      fecha,
      numeroFacturaProveedor: numeroFactura.trim() || undefined,
      metodoPago,
      fechaVencimientoPago: metodoPago === 'credito' ? fechaVencimientoPago : undefined,
      notas: notas.trim() || undefined,
      items: lineas.map((l) => ({
        productoId: l.producto.id,
        cantidad: l.cantidad,
        costoUnitario: l.costoUnitario,
        lote: l.lote.trim() || undefined,
        fechaVencimiento: l.fechaVencimiento || undefined,
      })),
    })
  }

  function handleAnular(id: string, numero: number) {
    const confirmado = window.confirm(
      `¿Anular la compra No. ${numero}? El inventario que agregó se descuenta de nuevo y no se puede deshacer.`,
    )
    if (confirmado) mutacionAnular.mutate(id)
  }

  return (
    <div className="gg-compras-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-compras-main">
        <div className="gg-compras-layout">
          <Card className="gg-compra-form-card">
            <h1 className="font-display gg-compras-title">Registrar compra</h1>
            <p className="gg-compras-subtitulo">
              Al guardar, el inventario y el costo promedio de cada producto se actualizan solos.
            </p>

            <form onSubmit={handleSubmit} noValidate className="gg-compra-form">
              <div className="gg-field">
                <label htmlFor="proveedor">Proveedor</label>
                <select
                  id="proveedor"
                  className="gg-input"
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                >
                  <option value="">Selecciona un proveedor…</option>
                  {proveedores?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="gg-compra-buscador">
                <Search size={18} className="gg-compra-buscador-icono" />
                <input
                  type="text"
                  className="gg-input gg-compra-buscador-input"
                  placeholder="Busca el producto que estás comprando…"
                  value={termino}
                  onChange={(e) => setTermino(e.target.value)}
                />
                {sugerencias && sugerencias.length > 0 && termino.trim().length >= 2 && (
                  <ul className="gg-compra-sugerencias">
                    {sugerencias.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => agregarProducto(p)}>
                          <span>{p.nombre}</span>
                          <span className="gg-compra-sugerencia-stock">{p.existencias} en stock</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {lineas.length === 0 ? (
                <p className="gg-compra-vacio">
                  <PackageSearch size={16} />
                  Busca y agrega los productos que llegaron en esta compra.
                </p>
              ) : (
                <ul className="gg-compra-lineas">
                  {lineas.map((linea) => (
                    <li key={linea.producto.id} className="gg-compra-linea">
                      <div className="gg-compra-linea-nombre">{linea.producto.nombre}</div>
                      <div className="gg-compra-linea-campos">
                        <div className="gg-compra-linea-campo">
                          <label>Cantidad</label>
                          <div className="gg-compra-cantidad">
                            <button type="button" onClick={() => actualizarLinea(linea.producto.id, { cantidad: Math.max(1, linea.cantidad - 1) })}>
                              <Minus size={12} />
                            </button>
                            <span>{linea.cantidad}</span>
                            <button type="button" onClick={() => actualizarLinea(linea.producto.id, { cantidad: linea.cantidad + 1 })}>
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="gg-compra-linea-campo">
                          <label>Costo unitario</label>
                          <input
                            type="number"
                            min="0"
                            className="gg-input"
                            value={linea.costoUnitario}
                            onChange={(e) => actualizarLinea(linea.producto.id, { costoUnitario: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="gg-compra-linea-campo">
                          <label>Lote (opcional)</label>
                          <input
                            type="text"
                            className="gg-input"
                            value={linea.lote}
                            onChange={(e) => actualizarLinea(linea.producto.id, { lote: e.target.value })}
                          />
                        </div>
                        <div className="gg-compra-linea-campo">
                          <label>Vencimiento (opcional)</label>
                          <input
                            type="date"
                            className="gg-input"
                            value={linea.fechaVencimiento}
                            onChange={(e) => actualizarLinea(linea.producto.id, { fechaVencimiento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="gg-compra-linea-subtotal">
                        {formatoCOP.format(linea.cantidad * linea.costoUnitario)}
                      </div>
                      <button
                        type="button"
                        className="gg-compra-linea-quitar"
                        onClick={() => quitarLinea(linea.producto.id)}
                        aria-label="Quitar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="gg-compra-grid-2">
                <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                <Input
                  label="No. factura del proveedor (opcional)"
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                />
              </div>

              <div className="gg-field">
                <label htmlFor="metodo-pago-compra">Método de pago</label>
                <select
                  id="metodo-pago-compra"
                  className="gg-input"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPagoCompra)}
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {metodoPago === 'credito' && (
                <Input
                  label="Vence el pago"
                  type="date"
                  value={fechaVencimientoPago}
                  onChange={(e) => setFechaVencimientoPago(e.target.value)}
                />
              )}

              <Input label="Notas (opcional)" type="text" value={notas} onChange={(e) => setNotas(e.target.value)} />

              <div className="gg-compra-total">
                <span>Total</span>
                <span>{formatoCOP.format(total)}</span>
              </div>

              <Button type="submit" size="lg" disabled={mutacion.isPending}>
                {mutacion.isPending ? (
                  <>
                    <Loader2 size={18} className="gg-spin" />
                    Guardando…
                  </>
                ) : (
                  'Registrar compra'
                )}
              </Button>

              {(error || mutacion.isError) && (
                <p className="gg-field-error">
                  {error ||
                    (mutacion.error instanceof ApiError
                      ? mutacion.error.message
                      : 'No pudimos registrar la compra. Intenta de nuevo.')}
                </p>
              )}
            </form>
          </Card>

          <Card className="gg-compra-historial-card">
            <h2 className="gg-compra-subtitulo-h2">Historial de compras</h2>

            {cargandoCompras && <p className="gg-compras-estado">Cargando historial…</p>}
            {errorCompras && <p className="gg-compras-estado">No pudimos cargar el historial.</p>}
            {!cargandoCompras && !errorCompras && compras?.length === 0 && (
              <p className="gg-compras-estado">Todavía no hay compras registradas.</p>
            )}

            {!cargandoCompras && !errorCompras && compras && compras.length > 0 && (
              <ul className="gg-compra-lista">
                {compras.map((c) => (
                  <li key={c.id} className="gg-compra-item">
                    <ReceiptText size={18} className="gg-compra-item-icono" />
                    <div className="gg-compra-item-info">
                      <div className="gg-compra-item-linea1">
                        <span className="gg-compra-item-descripcion">
                          {c.proveedorNombre} · {c.items.length} producto{c.items.length === 1 ? '' : 's'}
                        </span>
                        <span className="gg-compra-item-valor">{formatoCOP.format(c.total)}</span>
                      </div>
                      <div className="gg-compra-item-linea2">
                        <span>{formatoFecha(c.fecha)}</span>
                        <span>· No. {c.numero}</span>
                        {c.numeroFacturaProveedor && <span>· Fact. {c.numeroFacturaProveedor}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="gg-compra-item-anular"
                      onClick={() => handleAnular(c.id, c.numero)}
                      disabled={anulando === c.id}
                    >
                      <Ban size={14} />
                      {anulando === c.id ? 'Anulando…' : 'Anular'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
