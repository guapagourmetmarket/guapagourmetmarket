import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  ApiError,
  obtenerMovimientos,
  registrarAjuste,
  type MovimientoInventario,
  type ReferenciaTipo,
} from '../../lib/api'
import './kardex.css'

interface KardexProductoProps {
  productoId: string
  existenciasActuales: number
}

const ETIQUETA_REFERENCIA: Record<ReferenciaTipo, string> = {
  compra: 'Compra',
  venta: 'Venta',
  ajuste_manual: 'Ajuste manual',
  anulacion_compra: 'Anulación de compra',
  anulacion_venta: 'Anulación de venta',
}

const formatoFechaHora = (iso: string) => {
  const fecha = new Date(iso)
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function IconoMovimiento({ tipo }: { tipo: MovimientoInventario['tipo'] }) {
  if (tipo === 'entrada') return <ArrowUpCircle size={16} className="gg-kardex-icono gg-kardex-icono--entrada" />
  if (tipo === 'salida') return <ArrowDownCircle size={16} className="gg-kardex-icono gg-kardex-icono--salida" />
  return <SlidersHorizontal size={16} className="gg-kardex-icono gg-kardex-icono--ajuste" />
}

export function KardexProducto({ productoId, existenciasActuales }: KardexProductoProps) {
  const queryClient = useQueryClient()
  const [ajustando, setAjustando] = useState(false)
  const [cantidadNueva, setCantidadNueva] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  const { data: movimientos, isLoading } = useQuery({
    queryKey: ['inventario', 'movimientos', productoId],
    queryFn: () => obtenerMovimientos(productoId),
  })

  const mutacion = useMutation({
    mutationFn: registrarAjuste,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario', 'movimientos', productoId] })
      queryClient.invalidateQueries({ queryKey: ['producto', productoId] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setAjustando(false)
      setCantidadNueva('')
      setMotivo('')
      setError('')
    },
  })

  function handleAjustar(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (cantidadNueva.trim() === '') {
      setError('Indica las existencias reales.')
      return
    }
    if (motivo.trim().length < 3) {
      setError('Explica brevemente el motivo del ajuste.')
      return
    }
    mutacion.mutate({ productoId, cantidadNueva: Number(cantidadNueva), motivo: motivo.trim() })
  }

  return (
    <div className="gg-kardex">
      <div className="gg-kardex-header">
        <h2 className="gg-kardex-titulo">Historial de inventario</h2>
        {!ajustando && (
          <button type="button" className="gg-kardex-ajustar-link" onClick={() => { setAjustando(true); setCantidadNueva(String(existenciasActuales)) }}>
            Ajustar existencias
          </button>
        )}
      </div>

      {ajustando && (
        <form onSubmit={handleAjustar} className="gg-kardex-ajuste-form">
          <div className="gg-kardex-ajuste-grid">
            <Input
              label="Existencias reales"
              type="number"
              min="0"
              value={cantidadNueva}
              onChange={(e) => setCantidadNueva(e.target.value)}
              autoFocus
            />
            <Input
              label="Motivo"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Conteo físico, producto dañado…"
            />
          </div>
          <div className="gg-kardex-ajuste-acciones">
            <Button type="button" variant="secondary" onClick={() => setAjustando(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutacion.isPending}>
              {mutacion.isPending ? 'Guardando…' : 'Guardar ajuste'}
            </Button>
          </div>
          {(error || mutacion.isError) && (
            <p className="gg-field-error">
              {error ||
                (mutacion.error instanceof ApiError
                  ? mutacion.error.message
                  : 'No pudimos guardar el ajuste.')}
            </p>
          )}
        </form>
      )}

      {isLoading && <p className="gg-kardex-estado">Cargando historial…</p>}
      {!isLoading && movimientos?.length === 0 && (
        <p className="gg-kardex-estado">Todavía no hay movimientos registrados para este producto.</p>
      )}

      {!isLoading && movimientos && movimientos.length > 0 && (
        <ul className="gg-kardex-lista">
          {movimientos.map((m) => (
            <li key={m.id} className="gg-kardex-item">
              <IconoMovimiento tipo={m.tipo} />
              <div className="gg-kardex-item-info">
                <div className="gg-kardex-item-linea1">
                  <span>{ETIQUETA_REFERENCIA[m.referenciaTipo]}</span>
                  <span className={m.cantidad >= 0 ? 'gg-kardex-cantidad gg-kardex-cantidad--positiva' : 'gg-kardex-cantidad gg-kardex-cantidad--negativa'}>
                    {m.cantidad >= 0 ? '+' : ''}
                    {m.cantidad}
                  </span>
                </div>
                <div className="gg-kardex-item-linea2">
                  <span>{formatoFechaHora(m.createdAt)}</span>
                  <span>· Saldo: {m.saldoCantidad}</span>
                  {m.motivo && <span>· {m.motivo}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
