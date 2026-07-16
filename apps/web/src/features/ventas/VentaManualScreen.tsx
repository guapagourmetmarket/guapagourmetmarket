import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { Ban, Loader2, ReceiptText, Search, Sparkles, Trash2 } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { useEscaneoCodigoBarras } from '../../lib/useEscaneoCodigoBarras'
import { useCarrito } from '../../lib/carrito'
import { db } from '../../lib/db'
import {
  ApiError,
  anularVenta,
  buscarProductos,
  obtenerClientes,
  obtenerNegocio,
  obtenerVentas,
  type MetodoPago,
  type Venta,
} from '../../lib/api'
import { registrarVentaConSync, sincronizarOutbox } from '../../lib/sync'
import { precioEfectivo } from '../../lib/precio'
import { useConfirm } from '../../lib/confirm'
import { ReciboModal } from './ReciboModal'
import { DevolucionModal } from './DevolucionModal'
import { useDescuento } from './descuento'
import { CuponInput } from './CuponInput'
import { ControlCantidad } from './ControlCantidad'
import './ventas.css'

interface VentaManualScreenProps {
  onCerrarSesion: () => void
}

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'mixto', label: 'Mixto' },
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

function resumenVenta(venta: Venta) {
  if (venta.items.length > 0) {
    return venta.items.map((i) => `${i.cantidad}x ${i.nombreProducto}`).join(', ')
  }
  return venta.descripcion ?? 'Venta'
}

export function VentaManualScreen({ onCerrarSesion }: VentaManualScreenProps) {
  const queryClient = useQueryClient()
  const confirmar = useConfirm()
  const carrito = useCarrito()

  const { data: negocio } = useQuery({ queryKey: ['negocio'], queryFn: obtenerNegocio })
  const {
    data: ventas,
    isLoading: cargandoVentas,
    isError: errorVentas,
  } = useQuery({ queryKey: ['ventas'], queryFn: obtenerVentas })
  const { data: clientes } = useQuery({ queryKey: ['clientes', false], queryFn: () => obtenerClientes(false) })
  const pendientesOutbox = useLiveQuery(() => db.outboxVentas.orderBy('creadoEn').reverse().toArray(), [], [])

  const [termino, setTermino] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [cliente, setCliente] = useState('')
  const [descripcionLibre, setDescripcionLibre] = useState('')
  const [valorLibre, setValorLibre] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [fiado, setFiado] = useState(false)
  const [fechaVencimientoPago, setFechaVencimientoPago] = useState('')
  const [error, setError] = useState('')
  const [reciboVenta, setReciboVenta] = useState<Venta | null>(null)
  const [devolucionVenta, setDevolucionVenta] = useState<Venta | null>(null)
  const [anulando, setAnulando] = useState<string | null>(null)

  const clienteSeleccionado = useMemo(
    () => clientes?.find((c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase()),
    [clientes, cliente],
  )

  const { data: sugerencias } = useQuery({
    queryKey: ['productos', 'buscar', termino],
    queryFn: () => buscarProductos(termino),
    enabled: termino.trim().length >= 2,
  })

  async function manejarEscaneo(codigo: string) {
    setTermino('')
    try {
      const resultados = await buscarProductos(codigo)
      const exacto = resultados.find(
        (p) => p.codigoBarras === codigo || p.codigoInterno === codigo,
      )
      if (exacto) {
        carrito.agregarProducto(exacto)
        setError('')
        return
      }
      if (resultados.length === 1) {
        carrito.agregarProducto(resultados[0])
        setError('')
        return
      }
      setError(`No encontramos un producto con el código "${codigo}".`)
    } catch {
      setError('No pudimos buscar ese código. Intenta de nuevo.')
    }
  }

  const { inputRef, handleKeyDown, enfocar } = useEscaneoCodigoBarras(manejarEscaneo)

  const subtotal = carrito.total + (Number(valorLibre) || 0)
  const descuento = useDescuento(subtotal)

  const mutacion = useMutation({
    mutationFn: registrarVentaConSync,
    onSuccess: (ventaCreada) => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      carrito.vaciar()
      setCliente('')
      setDescripcionLibre('')
      setValorLibre('')
      setMetodoPago('efectivo')
      setFiado(false)
      setFechaVencimientoPago('')
      setFecha(hoy())
      descuento.reiniciar()
      setReciboVenta(ventaCreada)
      enfocar()
    },
  })

  const mutacionAnular = useMutation({
    mutationFn: anularVenta,
    onMutate: (id) => setAnulando(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    onSettled: () => setAnulando(null),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (subtotal <= 0) {
      setError('Agrega al menos un producto (escaneando o buscando) o ingresa un valor.')
      return
    }

    mutacion.mutate({
      fecha,
      clienteId: clienteSeleccionado?.id,
      clienteNombre: cliente.trim() || undefined,
      descripcion: descripcionLibre.trim() || undefined,
      valorLibre: Number(valorLibre) || undefined,
      descuento: descuento.monto || undefined,
      metodoPago,
      fiado: clienteSeleccionado ? fiado : undefined,
      fechaVencimientoPago: clienteSeleccionado && fiado ? fechaVencimientoPago || undefined : undefined,
      items: carrito.lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
    })
  }

  async function handleAnular(venta: Venta) {
    const confirmado = await confirmar(
      `¿Anular la venta No. ${venta.numero}? Esto devuelve el inventario vendido y no se puede deshacer.`,
      { peligro: true, textoConfirmar: 'Anular' },
    )
    if (confirmado) mutacionAnular.mutate(venta.id)
  }

  return (
    <div className="gg-ventas-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-ventas-main">
        {negocio && (
          <div className="gg-negocio-banda">
            <strong>{negocio.nombre}</strong>
            <span>NIT {negocio.nit}</span>
            {negocio.direccion && <span>{negocio.direccion}</span>}
          </div>
        )}

        <div className="gg-ventas-layout">
          <Card className="gg-venta-form-card">
            <h1 className="font-display gg-ventas-title">Registrar venta</h1>
            <p className="gg-ventas-subtitulo">
              Escanea con tu lector, busca por nombre, o agrega productos desde la pantalla de
              Productos. También puedes agregar un valor libre para lo que aún no está en el
              inventario.
            </p>

            <div className="gg-venta-buscador">
              <Search size={18} className="gg-venta-buscador-icono" />
              <input
                ref={inputRef}
                type="text"
                className="gg-input gg-venta-buscador-input"
                placeholder="Escanea el código o escribe el nombre del producto…"
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {sugerencias && sugerencias.length > 0 && termino.trim().length >= 2 && (
                <ul className="gg-venta-sugerencias">
                  {sugerencias.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          carrito.agregarProducto(p)
                          setTermino('')
                          setError('')
                        }}
                      >
                        <span>{p.nombre}</span>
                        <span className="gg-venta-sugerencia-precio">
                          {formatoCOP.format(p.precioVenta)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {carrito.lineas.length > 0 && (
              <ul className="gg-carrito-lista">
                {carrito.lineas.map((linea) => (
                  <li key={linea.producto.id} className="gg-carrito-linea">
                    <div className="gg-carrito-linea-info">
                      <span className="gg-carrito-linea-nombre">{linea.producto.nombre}</span>
                      <span className="gg-carrito-linea-precio">
                        {linea.producto.descuentoPorcentaje && (
                          <span className="gg-carrito-linea-precio-tachado">
                            {formatoCOP.format(linea.producto.precioVenta)}
                          </span>
                        )}
                        {formatoCOP.format(precioEfectivo(linea.producto))}{' '}
                        {linea.producto.vendePorPeso ? `/ ${linea.producto.unidadMedida}` : 'c/u'}
                        {linea.producto.descuentoPorcentaje && (
                          <span className="gg-carrito-linea-oferta">-{linea.producto.descuentoPorcentaje}%</span>
                        )}
                      </span>
                    </div>
                    <ControlCantidad linea={linea} />
                    <span className="gg-carrito-linea-subtotal">
                      {formatoCOP.format(precioEfectivo(linea.producto) * linea.cantidad)}
                    </span>
                    <button
                      type="button"
                      className="gg-carrito-linea-quitar"
                      onClick={() => carrito.quitarLinea(linea.producto.id)}
                      aria-label="Quitar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit} noValidate className="gg-venta-form">
              <div className="gg-venta-form-grid">
                <Input
                  label="Fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
                <div className="gg-field">
                  <label htmlFor="cliente-venta">Cliente (opcional)</label>
                  <input
                    id="cliente-venta"
                    className="gg-input"
                    list="lista-clientes-venta"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nombre del cliente"
                    autoComplete="off"
                  />
                  <datalist id="lista-clientes-venta">
                    {clientes?.map((c) => <option key={c.id} value={c.nombre} />)}
                  </datalist>
                </div>
              </div>

              {clienteSeleccionado && (
                <div className="gg-venta-cliente-info">
                  <span className="gg-cliente-puntos-chip">
                    <Sparkles size={12} />
                    {clienteSeleccionado.puntos} puntos
                  </span>
                  <label className="gg-toggle-desactivados">
                    <input type="checkbox" checked={fiado} onChange={(e) => setFiado(e.target.checked)} />
                    Venta fiada (a crédito)
                  </label>
                  {fiado && (
                    <Input
                      label="Vence el pago"
                      type="date"
                      value={fechaVencimientoPago}
                      onChange={(e) => setFechaVencimientoPago(e.target.value)}
                    />
                  )}
                </div>
              )}

              <Input
                label="Otro (opcional) — algo que no está en el inventario todavía"
                type="text"
                value={descripcionLibre}
                onChange={(e) => setDescripcionLibre(e.target.value)}
                placeholder="Ej: Torta por encargo"
              />
              <Input
                label="Valor de lo anterior"
                type="number"
                min="0"
                value={valorLibre}
                onChange={(e) => setValorLibre(e.target.value)}
                placeholder="0"
              />

              <div className="gg-field">
                <label htmlFor="metodo-pago">Método de pago</label>
                <select
                  id="metodo-pago"
                  className="gg-input"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <CuponInput
                onAplicar={(pct) => {
                  descuento.setTipo('porcentaje')
                  descuento.setEntrada(String(pct))
                }}
                onQuitar={() => descuento.setEntrada('')}
              />

              <div className="gg-field">
                <label htmlFor="descuento-venta">Descuento (opcional)</label>
                <div className="gg-venta-descuento">
                  <input
                    id="descuento-venta"
                    className="gg-input"
                    type="number"
                    min="0"
                    value={descuento.entrada}
                    onChange={(e) => descuento.setEntrada(e.target.value)}
                    placeholder="0"
                  />
                  <select
                    className="gg-input"
                    value={descuento.tipo}
                    onChange={(e) => descuento.setTipo(e.target.value as 'porcentaje' | 'valor')}
                    aria-label="Tipo de descuento"
                  >
                    <option value="porcentaje">%</option>
                    <option value="valor">$</option>
                  </select>
                </div>
              </div>

              {descuento.monto > 0 && (
                <div className="gg-venta-subtotal">
                  <span>Subtotal</span>
                  <span>{formatoCOP.format(subtotal)}</span>
                </div>
              )}
              {descuento.monto > 0 && (
                <div className="gg-venta-subtotal">
                  <span>Descuento</span>
                  <span>−{formatoCOP.format(descuento.monto)}</span>
                </div>
              )}

              <div className="gg-venta-total">
                <span>Total</span>
                <span>{formatoCOP.format(descuento.total)}</span>
              </div>

              <Button type="submit" size="lg" disabled={mutacion.isPending}>
                {mutacion.isPending ? (
                  <>
                    <Loader2 size={18} className="gg-spin" />
                    Guardando…
                  </>
                ) : (
                  'Guardar venta'
                )}
              </Button>

              {(error || mutacion.isError) && (
                <p className="gg-field-error">
                  {error ||
                    (mutacion.error instanceof ApiError
                      ? mutacion.error.message
                      : 'No pudimos guardar la venta. Intenta de nuevo.')}
                </p>
              )}
            </form>
          </Card>

          <Card className="gg-venta-historial-card">
            {pendientesOutbox && pendientesOutbox.length > 0 && (
              <div className="gg-venta-pendientes">
                <div className="gg-venta-pendientes-header">
                  <span>
                    {pendientesOutbox.length} venta{pendientesOutbox.length === 1 ? '' : 's'} sin
                    sincronizar
                  </span>
                  <button type="button" onClick={() => sincronizarOutbox()}>
                    Reintentar ahora
                  </button>
                </div>
                <ul className="gg-venta-lista">
                  {pendientesOutbox.map((p) => (
                    <li key={p.id} className="gg-venta-item">
                      <ReceiptText size={18} className="gg-venta-item-icono" />
                      <div className="gg-venta-item-info">
                        <div className="gg-venta-item-linea1">
                          <span className="gg-venta-item-descripcion">
                            {p.payload.items.length} producto{p.payload.items.length === 1 ? '' : 's'}
                            {p.payload.descripcion ? ` · ${p.payload.descripcion}` : ''}
                          </span>
                        </div>
                        <div className="gg-venta-item-linea2">
                          <span>{new Date(p.creadoEn).toLocaleString('es-CO')}</span>
                          {p.error && <span className="gg-cliente-badge-fiado">{p.error}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className="gg-ventas-subtitulo-h2">Historial de ventas</h2>

            {cargandoVentas && <p className="gg-ventas-estado">Cargando historial…</p>}
            {errorVentas && (
              <p className="gg-ventas-estado">No pudimos cargar el historial de ventas.</p>
            )}
            {!cargandoVentas && !errorVentas && ventas?.length === 0 && (
              <p className="gg-ventas-estado">Todavía no hay ventas registradas.</p>
            )}

            {!cargandoVentas && !errorVentas && ventas && ventas.length > 0 && (
              <ul className="gg-venta-lista">
                {ventas.map((venta) => (
                  <li key={venta.id} className="gg-venta-item">
                    <ReceiptText size={18} className="gg-venta-item-icono" />
                    <div className="gg-venta-item-info">
                      <div className="gg-venta-item-linea1">
                        <span className="gg-venta-item-descripcion">{resumenVenta(venta)}</span>
                        <span className="gg-venta-item-valor">{formatoCOP.format(venta.valor)}</span>
                      </div>
                      <div className="gg-venta-item-linea2">
                        <span>{formatoFecha(venta.fecha)}</span>
                        {venta.clienteNombre && <span>· {venta.clienteNombre}</span>}
                        <span>· {METODOS_PAGO.find((m) => m.value === venta.metodoPago)?.label}</span>
                        {!venta.pagado && <span className="gg-cliente-badge-fiado">Fiado</span>}
                      </div>
                    </div>
                    <div className="gg-venta-item-acciones">
                      <button
                        type="button"
                        className="gg-venta-item-recibo"
                        onClick={() => setReciboVenta(venta)}
                      >
                        Ver recibo
                      </button>
                      {venta.items.some((i) => i.cantidad - i.cantidadDevuelta > 0) && (
                        <button
                          type="button"
                          className="gg-venta-item-recibo"
                          onClick={() => setDevolucionVenta(venta)}
                        >
                          Devolver
                        </button>
                      )}
                      <button
                        type="button"
                        className="gg-venta-item-anular"
                        onClick={() => handleAnular(venta)}
                        disabled={anulando === venta.id}
                      >
                        <Ban size={14} />
                        {anulando === venta.id ? 'Anulando…' : 'Anular'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>

      {reciboVenta && (
        <ReciboModal venta={reciboVenta} negocio={negocio} onClose={() => setReciboVenta(null)} />
      )}
      {devolucionVenta && (
        <DevolucionModal venta={devolucionVenta} onClose={() => setDevolucionVenta(null)} />
      )}
    </div>
  )
}
