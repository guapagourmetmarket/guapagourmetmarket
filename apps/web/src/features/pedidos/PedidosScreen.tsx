import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cake, Check, Loader2, Trash2, X } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  ApiError,
  cambiarEstadoPedido,
  crearPedido,
  eliminarPedido,
  obtenerPedidos,
  type EstadoPedidoEncargo,
} from '../../lib/api'
import { useConfirm } from '../../lib/confirm'
import '../contabilidad/contabilidad.css'
import './pedidos.css'

interface PedidosScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const hoy = () => new Date().toISOString().slice(0, 10)

function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

const ETIQUETAS_ESTADO: Record<EstadoPedidoEncargo, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export function PedidosScreen({ onCerrarSesion }: PedidosScreenProps) {
  const queryClient = useQueryClient()
  const confirmar = useConfirm()
  const { data: pedidos, isLoading, isError } = useQuery({ queryKey: ['pedidos'], queryFn: obtenerPedidos })

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState(hoy())
  const [valor, setValor] = useState('')
  const [anticipo, setAnticipo] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState<string | null>(null)

  const mutacion = useMutation({
    mutationFn: crearPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-resumen'] })
      setClienteNombre('')
      setClienteTelefono('')
      setDescripcion('')
      setFechaEntrega(hoy())
      setValor('')
      setAnticipo('')
      setNotas('')
      setError('')
    },
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPedidoEncargo }) =>
      cambiarEstadoPedido(id, estado),
    onMutate: ({ id }) => setProcesando(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-resumen'] })
    },
    onSettled: () => setProcesando(null),
  })

  const mutacionEliminar = useMutation({
    mutationFn: eliminarPedido,
    onMutate: (id) => setProcesando(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-resumen'] })
    },
    onSettled: () => setProcesando(null),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (clienteNombre.trim().length < 2) {
      setError('Indica el nombre del cliente.')
      return
    }
    if (descripcion.trim().length < 3) {
      setError('Describe qué encargó (ej. "Torta de chocolate 3 pisos").')
      return
    }
    if (!fechaEntrega) {
      setError('Indica la fecha de entrega.')
      return
    }
    mutacion.mutate({
      clienteNombre: clienteNombre.trim(),
      clienteTelefono: clienteTelefono.trim() || undefined,
      descripcion: descripcion.trim(),
      fechaEntrega,
      valor: valor.trim() ? Number(valor) : undefined,
      anticipo: anticipo.trim() ? Number(anticipo) : undefined,
      notas: notas.trim() || undefined,
    })
  }

  async function handleEliminar(id: string, nombre: string) {
    const confirmado = await confirmar(`¿Eliminar el pedido de "${nombre}"? No se puede deshacer.`, {
      peligro: true,
      textoConfirmar: 'Eliminar',
    })
    if (confirmado) mutacionEliminar.mutate(id)
  }

  return (
    <div className="gg-contabilidad-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-contabilidad-main">
        <div className="gg-contabilidad-layout">
          <Card>
            <h1 className="font-display gg-contabilidad-title">Nuevo pedido por encargo</h1>
            <p className="gg-contabilidad-subtitulo">
              Tortas u otros encargos especiales para una fecha, que aún no están en el inventario
              normal. Te avisamos en el menú cuando la entrega esté cerca.
            </p>

            <form onSubmit={handleSubmit} noValidate className="gg-gasto-form">
              <Input
                label="Nombre del cliente"
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej: Marta Gómez"
              />
              <Input
                label="Teléfono (opcional)"
                type="tel"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="Ej: 300 123 4567"
              />
              <div className="gg-field">
                <label htmlFor="descripcion-pedido">¿Qué encargó?</label>
                <textarea
                  id="descripcion-pedido"
                  className="gg-input"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Torta de chocolate 3 pisos, para 20 personas"
                />
              </div>
              <Input
                label="Fecha de entrega"
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
              <div className="gg-contabilidad-grid-2">
                <Input
                  label="Valor total (opcional)"
                  type="number"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="Anticipo (opcional)"
                  type="number"
                  min="0"
                  value={anticipo}
                  onChange={(e) => setAnticipo(e.target.value)}
                  placeholder="0"
                />
              </div>
              <Input
                label="Notas (opcional)"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: sin gluten, entregar antes de las 3pm"
              />

              <Button type="submit" size="lg" disabled={mutacion.isPending}>
                {mutacion.isPending ? (
                  <>
                    <Loader2 size={18} className="gg-spin" />
                    Guardando…
                  </>
                ) : (
                  'Guardar pedido'
                )}
              </Button>

              {(error || mutacion.isError) && (
                <p className="gg-field-error">
                  {error ||
                    (mutacion.error instanceof ApiError
                      ? mutacion.error.message
                      : 'No pudimos guardar el pedido.')}
                </p>
              )}
            </form>
          </Card>

          <Card>
            <h2 className="gg-contabilidad-subtitulo-h2">Pedidos por encargo</h2>

            {isLoading && <p className="gg-contabilidad-estado">Cargando…</p>}
            {isError && <p className="gg-contabilidad-estado">No pudimos cargar los pedidos.</p>}
            {!isLoading && !isError && pedidos?.length === 0 && (
              <p className="gg-contabilidad-estado">Todavía no hay pedidos por encargo.</p>
            )}

            {!isLoading && !isError && pedidos && pedidos.length > 0 && (
              <ul className="gg-gasto-lista">
                {pedidos.map((p) => (
                  <li key={p.id} className="gg-gasto-item">
                    <Cake size={18} className="gg-gasto-item-icono" />
                    <div className="gg-gasto-item-info">
                      <div className="gg-gasto-item-linea1">
                        <span className="gg-gasto-item-descripcion">
                          {p.clienteNombre} — {p.descripcion}
                        </span>
                        {p.valor !== null && (
                          <span className="gg-gasto-item-valor" style={{ color: 'var(--c-sageDeep)' }}>
                            {formatoCOP.format(p.valor)}
                          </span>
                        )}
                      </div>
                      <div className="gg-gasto-item-linea2">
                        <span>Entrega: {formatoFecha(p.fechaEntrega)}</span>
                        {p.clienteTelefono && <span>· {p.clienteTelefono}</span>}
                        <span className={'gg-pedido-estado gg-pedido-estado--' + p.estado}>
                          {ETIQUETAS_ESTADO[p.estado]}
                        </span>
                      </div>
                    </div>
                    {p.estado === 'pendiente' && (
                      <>
                        <button
                          type="button"
                          className="gg-gasto-item-eliminar"
                          style={{ color: 'var(--c-sageDeep)' }}
                          title="Marcar como entregado"
                          disabled={procesando === p.id}
                          onClick={() => mutacionEstado.mutate({ id: p.id, estado: 'entregado' })}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          className="gg-gasto-item-eliminar"
                          style={{ color: 'var(--c-muted)' }}
                          title="Cancelar pedido"
                          disabled={procesando === p.id}
                          onClick={() => mutacionEstado.mutate({ id: p.id, estado: 'cancelado' })}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="gg-gasto-item-eliminar"
                      title="Eliminar pedido"
                      disabled={procesando === p.id}
                      onClick={() => handleEliminar(p.id, p.clienteNombre)}
                    >
                      <Trash2 size={16} />
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
