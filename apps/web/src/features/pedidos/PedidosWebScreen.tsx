import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { SkeletonFila } from '../../components/Skeleton'
import { cambiarEstadoPedidoWeb, obtenerPedidosWeb, type EstadoPedidoWeb } from '../../lib/api'
import '../contabilidad/contabilidad.css'
import './pedidos.css'
import './pedidos-web.css'

interface PedidosWebScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const ETIQUETAS_ESTADO: Record<EstadoPedidoWeb, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  despachado: 'Despachado',
  cancelado: 'Cancelado',
}

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedidoWeb, { estado: EstadoPedidoWeb; label: string }>> = {
  pendiente: { estado: 'confirmado', label: 'Confirmar' },
  confirmado: { estado: 'despachado', label: 'Marcar despachado' },
}

function formatoFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PedidosWebScreen({ onCerrarSesion }: PedidosWebScreenProps) {
  const queryClient = useQueryClient()
  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['pedidos-web'],
    queryFn: obtenerPedidosWeb,
  })
  const [procesando, setProcesando] = useState<string | null>(null)

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPedidoWeb }) => cambiarEstadoPedidoWeb(id, estado),
    onMutate: ({ id }) => setProcesando(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos-web'] }),
    onSettled: () => setProcesando(null),
  })

  return (
    <div className="gg-contabilidad-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-contabilidad-main">
        <h1 className="font-display gg-contabilidad-title">Pedidos web</h1>
        <p className="gg-contabilidad-subtitulo">
          Pre-pedidos que la gente arma sola desde la tienda pública. El pago no queda cobrado aquí:
          se coordina directo con el cliente al confirmar.
        </p>

        <Card style={{ marginTop: 16 }}>
          {isLoading && <SkeletonFila cantidad={4} />}
          {isError && <p className="gg-contabilidad-estado">No pudimos cargar los pedidos web.</p>}
          {!isLoading && !isError && pedidos?.length === 0 && (
            <p className="gg-contabilidad-estado">Todavía no ha llegado ningún pedido desde la tienda.</p>
          )}

          {!isLoading && !isError && pedidos && pedidos.length > 0 && (
            <ul className="gg-gasto-lista">
              {pedidos.map((p) => {
                const siguiente = SIGUIENTE_ESTADO[p.estado]
                return (
                  <li key={p.id} className="gg-gasto-item gg-pedido-web-item">
                    <ShoppingBag size={18} className="gg-gasto-item-icono" />
                    <div className="gg-gasto-item-info">
                      <div className="gg-gasto-item-linea1">
                        <span className="gg-gasto-item-descripcion">
                          No. {p.numero} — {p.clienteNombre} · {p.clienteTelefono}
                        </span>
                        <span className="gg-gasto-item-valor" style={{ color: 'var(--c-sageDeep)' }}>
                          {formatoCOP.format(p.valor)}
                        </span>
                      </div>
                      <ul className="gg-pedido-web-items">
                        {p.items.map((item) => (
                          <li key={item.id}>
                            {item.cantidad} x {item.nombreProducto}
                          </li>
                        ))}
                      </ul>
                      <div className="gg-gasto-item-linea2">
                        <span>{formatoFechaHora(p.createdAt)}</span>
                        {p.notas && <span>· {p.notas}</span>}
                        <span className={'gg-pedido-estado gg-pedido-estado--' + p.estado}>
                          {ETIQUETAS_ESTADO[p.estado]}
                        </span>
                      </div>
                    </div>
                    {siguiente && (
                      <button
                        type="button"
                        className="gg-pedido-web-boton-avanzar"
                        disabled={procesando === p.id}
                        onClick={() => mutacionEstado.mutate({ id: p.id, estado: siguiente.estado })}
                      >
                        {siguiente.label}
                      </button>
                    )}
                    {(p.estado === 'pendiente' || p.estado === 'confirmado') && (
                      <button
                        type="button"
                        className="gg-gasto-item-eliminar"
                        title="Cancelar pedido"
                        disabled={procesando === p.id}
                        onClick={() => mutacionEstado.mutate({ id: p.id, estado: 'cancelado' })}
                      >
                        Cancelar
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </main>
    </div>
  )
}
