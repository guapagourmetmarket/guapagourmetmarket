import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, LockOpen, Wallet } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { ApiError, abrirCaja, cerrarCaja, obtenerTurnoActual, obtenerTurnos } from '../../lib/api'
import './caja.css'

interface CajaScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatoFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function CajaScreen({ onCerrarSesion }: CajaScreenProps) {
  const queryClient = useQueryClient()
  const { data: turnoActual, isLoading } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: obtenerTurnoActual,
  })
  const { data: historial } = useQuery({ queryKey: ['caja-historial'], queryFn: obtenerTurnos })

  const [efectivoInicial, setEfectivoInicial] = useState('')
  const [cerrandoCaja, setCerrandoCaja] = useState(false)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')

  function invalidarCaja() {
    queryClient.invalidateQueries({ queryKey: ['caja-actual'] })
    queryClient.invalidateQueries({ queryKey: ['caja-historial'] })
  }

  const mutacionAbrir = useMutation({
    mutationFn: (valor: number) => abrirCaja(valor),
    onSuccess: () => {
      invalidarCaja()
      setEfectivoInicial('')
      setError('')
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'No pudimos abrir la caja.'),
  })

  const mutacionCerrar = useMutation({
    mutationFn: () => cerrarCaja(turnoActual!.id, Number(efectivoContado), notas.trim() || undefined),
    onSuccess: () => {
      invalidarCaja()
      setCerrandoCaja(false)
      setEfectivoContado('')
      setNotas('')
      setError('')
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'No pudimos cerrar la caja.'),
  })

  function handleAbrir(e: FormEvent) {
    e.preventDefault()
    setError('')
    const valor = Number(efectivoInicial)
    if (efectivoInicial.trim() === '' || Number.isNaN(valor) || valor < 0) {
      setError('Ingresa un valor de efectivo inicial válido.')
      return
    }
    mutacionAbrir.mutate(valor)
  }

  const efectivoEnCajaAhora = turnoActual ? turnoActual.efectivoInicial + turnoActual.totalEfectivo : 0
  const diferenciaPreview =
    cerrandoCaja && efectivoContado.trim() !== '' && !Number.isNaN(Number(efectivoContado))
      ? Number(efectivoContado) - efectivoEnCajaAhora
      : null

  return (
    <div className="gg-caja-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-caja-main">
        <h1 className="font-display gg-caja-title">Caja</h1>

        {isLoading && (
          <Card className="gg-caja-estado">
            <p>Cargando…</p>
          </Card>
        )}

        {!isLoading && !turnoActual && (
          <Card className="gg-caja-tarjeta gg-caja-tarjeta--cerrada">
            <div className="gg-caja-icono-estado">
              <LockOpen size={26} />
            </div>
            <h2 className="gg-caja-tarjeta-titulo">La caja está cerrada</h2>
            <p className="gg-caja-subtitulo">
              Abre la caja con el efectivo con el que arrancas el día para poder llevar el arqueo al
              cerrarla.
            </p>
            <form onSubmit={handleAbrir} className="gg-caja-form-abrir">
              <Input
                label="Efectivo inicial"
                type="number"
                min="0"
                step="100"
                value={efectivoInicial}
                onChange={(e) => setEfectivoInicial(e.target.value)}
                placeholder="0"
              />
              <Button type="submit" disabled={mutacionAbrir.isPending}>
                {mutacionAbrir.isPending ? 'Abriendo…' : 'Abrir caja'}
              </Button>
            </form>
            {error && <p className="gg-field-error">{error}</p>}
          </Card>
        )}

        {!isLoading && turnoActual && (
          <Card className="gg-caja-tarjeta gg-caja-tarjeta--abierta">
            <div className="gg-caja-icono-estado gg-caja-icono-estado--abierta">
              <Wallet size={26} />
            </div>
            <h2 className="gg-caja-tarjeta-titulo">Caja abierta</h2>
            <p className="gg-caja-subtitulo">
              Abierta por {turnoActual.usuarioNombre} el {formatoFechaHora(turnoActual.abiertoEn)}
            </p>

            <div className="gg-caja-metricas">
              <div className="gg-caja-metrica">
                <span>Efectivo inicial</span>
                <strong>{formatoCOP.format(turnoActual.efectivoInicial)}</strong>
              </div>
              <div className="gg-caja-metrica">
                <span>Ventas del turno</span>
                <strong>{turnoActual.cantidadVentas}</strong>
              </div>
              <div className="gg-caja-metrica">
                <span>Total vendido</span>
                <strong>{formatoCOP.format(turnoActual.totalVentas)}</strong>
              </div>
              <div className="gg-caja-metrica">
                <span>Ventas en efectivo</span>
                <strong>{formatoCOP.format(turnoActual.totalEfectivo)}</strong>
              </div>
              <div className="gg-caja-metrica gg-caja-metrica--destacada">
                <span>Efectivo que debería haber ahora</span>
                <strong>{formatoCOP.format(efectivoEnCajaAhora)}</strong>
              </div>
            </div>

            <Button type="button" variant="secondary" onClick={() => setCerrandoCaja(true)}>
              <Lock size={18} />
              Cerrar caja
            </Button>
          </Card>
        )}

        <Card className="gg-caja-historial">
          <h2 className="gg-caja-historial-titulo">Historial de turnos</h2>
          {!historial || historial.length === 0 ? (
            <p className="gg-caja-subtitulo">Todavía no hay turnos registrados.</p>
          ) : (
            <div className="gg-caja-tabla-wrap">
              <table className="gg-caja-tabla">
                <thead>
                  <tr>
                    <th>Cajero</th>
                    <th>Abierto</th>
                    <th>Cerrado</th>
                    <th>Inicial</th>
                    <th>Esperado</th>
                    <th>Contado</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((t) => (
                    <tr key={t.id}>
                      <td>{t.usuarioNombre}</td>
                      <td>{formatoFechaHora(t.abiertoEn)}</td>
                      <td>
                        {t.cerradoEn ? (
                          formatoFechaHora(t.cerradoEn)
                        ) : (
                          <span className="gg-caja-badge-abierto">Abierta</span>
                        )}
                      </td>
                      <td>{formatoCOP.format(t.efectivoInicial)}</td>
                      <td>{t.efectivoEsperado === null ? '—' : formatoCOP.format(t.efectivoEsperado)}</td>
                      <td>{t.efectivoContado === null ? '—' : formatoCOP.format(t.efectivoContado)}</td>
                      <td>
                        {t.diferencia === null ? (
                          '—'
                        ) : (
                          <span
                            className={
                              t.diferencia === 0
                                ? ''
                                : t.diferencia > 0
                                  ? 'gg-caja-diferencia-positiva'
                                  : 'gg-caja-diferencia-negativa'
                            }
                          >
                            {formatoCOP.format(t.diferencia)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {cerrandoCaja && turnoActual && (
        <Modal
          title="Cerrar caja"
          onClose={() => {
            setCerrandoCaja(false)
            setError('')
          }}
        >
          <p className="gg-caja-subtitulo">
            Cuenta el efectivo físico que hay en la caja ahora mismo y anótalo aquí.
          </p>
          <div className="gg-caja-form-cerrar">
            <Input
              label="Efectivo contado"
              type="number"
              min="0"
              step="100"
              value={efectivoContado}
              onChange={(e) => setEfectivoContado(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Notas (opcional)"
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: faltaron $2.000 en vueltos"
            />
            {diferenciaPreview !== null && (
              <p
                className={
                  diferenciaPreview === 0
                    ? 'gg-caja-diferencia-ok'
                    : diferenciaPreview > 0
                      ? 'gg-caja-diferencia-positiva'
                      : 'gg-caja-diferencia-negativa'
                }
              >
                {diferenciaPreview === 0
                  ? 'Cuadra exacto.'
                  : diferenciaPreview > 0
                    ? `Sobran ${formatoCOP.format(diferenciaPreview)}`
                    : `Faltan ${formatoCOP.format(Math.abs(diferenciaPreview))}`}
              </p>
            )}
            {error && <p className="gg-field-error">{error}</p>}
            <Button
              type="button"
              disabled={mutacionCerrar.isPending || efectivoContado.trim() === ''}
              onClick={() => mutacionCerrar.mutate()}
            >
              {mutacionCerrar.isPending ? 'Cerrando…' : 'Confirmar cierre'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
