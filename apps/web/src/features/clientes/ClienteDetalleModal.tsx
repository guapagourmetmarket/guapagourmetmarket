import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gift, Receipt, Sparkles } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  ApiError,
  canjearPuntos,
  obtenerCliente,
  obtenerHistorialComprasCliente,
  obtenerMovimientosPuntos,
  type Cliente,
} from '../../lib/api'
import './clientes.css'

interface ClienteDetalleModalProps {
  cliente: Cliente
  onClose: () => void
}

const formatoMoneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function ClienteDetalleModal({ cliente, onClose }: ClienteDetalleModalProps) {
  const queryClient = useQueryClient()
  const [pestana, setPestana] = useState<'compras' | 'puntos'>('compras')
  const [puntosCanjear, setPuntosCanjear] = useState('')
  const [motivoCanjear, setMotivoCanjear] = useState('')
  const [error, setError] = useState('')

  const { data: clienteActual } = useQuery({
    queryKey: ['clientes', cliente.id],
    queryFn: () => obtenerCliente(cliente.id),
    initialData: cliente,
  })

  const { data: compras, isLoading: cargandoCompras } = useQuery({
    queryKey: ['clientes', cliente.id, 'compras'],
    queryFn: () => obtenerHistorialComprasCliente(cliente.id),
  })

  const { data: movimientos, isLoading: cargandoMovimientos } = useQuery({
    queryKey: ['clientes', cliente.id, 'puntos'],
    queryFn: () => obtenerMovimientosPuntos(cliente.id),
    enabled: pestana === 'puntos',
  })

  const mutacionCanje = useMutation({
    mutationFn: () => canjearPuntos(cliente.id, Number(puntosCanjear), motivoCanjear.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setPuntosCanjear('')
      setMotivoCanjear('')
    },
  })

  function handleCanjear(e: FormEvent) {
    e.preventDefault()
    setError('')
    const puntos = Number(puntosCanjear)
    if (!puntos || puntos <= 0) {
      setError('Ingresa una cantidad de puntos válida.')
      return
    }
    if (puntos > clienteActual.puntos) {
      setError(`El cliente solo tiene ${clienteActual.puntos} puntos disponibles.`)
      return
    }
    if (!motivoCanjear.trim()) {
      setError('Indica el motivo del canje.')
      return
    }
    mutacionCanje.mutate()
  }

  return (
    <Modal title={cliente.nombre} onClose={onClose}>
      <div className="gg-cliente-detalle">
        <div className="gg-cliente-detalle-puntos">
          <Sparkles size={18} />
          <span>
            <strong>{clienteActual.puntos}</strong> puntos acumulados
          </span>
        </div>

        <div className="gg-cliente-tabs">
          <button
            type="button"
            className={'gg-cliente-tab' + (pestana === 'compras' ? ' gg-cliente-tab--activo' : '')}
            onClick={() => setPestana('compras')}
          >
            <Receipt size={14} />
            Compras
          </button>
          <button
            type="button"
            className={'gg-cliente-tab' + (pestana === 'puntos' ? ' gg-cliente-tab--activo' : '')}
            onClick={() => setPestana('puntos')}
          >
            <Gift size={14} />
            Puntos
          </button>
        </div>

        {pestana === 'compras' && (
          <div className="gg-cliente-lista">
            {cargandoCompras && <p className="gg-cliente-vacio">Cargando historial…</p>}
            {!cargandoCompras && (compras?.length ?? 0) === 0 && (
              <p className="gg-cliente-vacio">Este cliente aún no tiene compras registradas.</p>
            )}
            {compras?.map((v) => (
              <div key={v.id} className="gg-cliente-item">
                <div>
                  <p className="gg-cliente-item-titulo">Recibo No. {v.numero}</p>
                  <p className="gg-cliente-item-sub">{v.fecha}</p>
                </div>
                <div className="gg-cliente-item-derecha">
                  <span className="gg-cliente-item-valor">{formatoMoneda.format(v.valor)}</span>
                  {!v.pagado && <span className="gg-cliente-badge-fiado">Fiado</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {pestana === 'puntos' && (
          <>
            <form onSubmit={handleCanjear} className="gg-cliente-canje">
              <Input
                label="Puntos a canjear"
                type="number"
                min={1}
                value={puntosCanjear}
                onChange={(e) => setPuntosCanjear(e.target.value)}
              />
              <Input
                label="Motivo"
                type="text"
                value={motivoCanjear}
                onChange={(e) => setMotivoCanjear(e.target.value)}
                placeholder="Ej: Canje por descuento en caja"
              />
              <Button type="submit" variant="secondary" disabled={mutacionCanje.isPending}>
                {mutacionCanje.isPending ? 'Canjeando…' : 'Canjear puntos'}
              </Button>
              {(error || mutacionCanje.isError) && (
                <p className="gg-field-error">
                  {error ||
                    (mutacionCanje.error instanceof ApiError
                      ? mutacionCanje.error.message
                      : 'No pudimos canjear los puntos.')}
                </p>
              )}
            </form>

            <div className="gg-cliente-lista">
              {cargandoMovimientos && <p className="gg-cliente-vacio">Cargando movimientos…</p>}
              {!cargandoMovimientos && (movimientos?.length ?? 0) === 0 && (
                <p className="gg-cliente-vacio">Sin movimientos de puntos todavía.</p>
              )}
              {movimientos?.map((m) => (
                <div key={m.id} className="gg-cliente-item">
                  <div>
                    <p className="gg-cliente-item-titulo">{m.motivo ?? m.tipo}</p>
                    <p className="gg-cliente-item-sub">{new Date(m.createdAt).toLocaleDateString('es-CO')}</p>
                  </div>
                  <span className={'gg-cliente-item-valor' + (m.puntos < 0 ? ' gg-cliente-item-valor--negativo' : '')}>
                    {m.puntos > 0 ? '+' : ''}
                    {m.puntos}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
