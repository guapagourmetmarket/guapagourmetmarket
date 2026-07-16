import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ReceiptText, Trash2 } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  ApiError,
  crearGasto,
  eliminarGasto,
  obtenerGastos,
  type MetodoPagoGasto,
} from '../../lib/api'
import { useConfirm } from '../../lib/confirm'
import './contabilidad.css'

interface GastosScreenProps {
  onCerrarSesion: () => void
}

const CATEGORIAS_SUGERIDAS = ['Arriendo', 'Servicios', 'Nómina', 'Insumos', 'Transporte', 'Otro']

const METODOS_PAGO: { value: MetodoPagoGasto; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
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

export function GastosScreen({ onCerrarSesion }: GastosScreenProps) {
  const queryClient = useQueryClient()
  const confirmar = useConfirm()
  const { data: gastos, isLoading, isError } = useQuery({ queryKey: ['gastos'], queryFn: obtenerGastos })

  const [fecha, setFecha] = useState(hoy())
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [valor, setValor] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPagoGasto>('efectivo')
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState<string | null>(null)

  const mutacion = useMutation({
    mutationFn: crearGasto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      queryClient.invalidateQueries({ queryKey: ['contabilidad'] })
      setCategoria('')
      setDescripcion('')
      setValor('')
      setMetodoPago('efectivo')
      setFecha(hoy())
      setError('')
    },
  })

  const mutacionEliminar = useMutation({
    mutationFn: eliminarGasto,
    onMutate: (id) => setEliminando(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      queryClient.invalidateQueries({ queryKey: ['contabilidad'] })
    },
    onSettled: () => setEliminando(null),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!categoria.trim()) {
      setError('Indica la categoría del gasto.')
      return
    }
    if (!valor || Number(valor) <= 0) {
      setError('El valor debe ser mayor a cero.')
      return
    }
    mutacion.mutate({
      fecha,
      categoria: categoria.trim(),
      descripcion: descripcion.trim() || undefined,
      valor: Number(valor),
      metodoPago,
    })
  }

  async function handleEliminar(id: string) {
    const confirmado = await confirmar('¿Eliminar este gasto? No se puede deshacer.', {
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
          <Card className="gg-gasto-form-card">
            <h1 className="font-display gg-contabilidad-title">Registrar gasto</h1>
            <p className="gg-contabilidad-subtitulo">
              Arriendo, servicios, nómina, insumos — todo lo que sale de caja y no es una compra de inventario.
            </p>

            <form onSubmit={handleSubmit} noValidate className="gg-gasto-form">
              <div className="gg-field">
                <label htmlFor="categoria-gasto">Categoría</label>
                <input
                  id="categoria-gasto"
                  className="gg-input"
                  list="lista-categorias-gasto"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Servicios"
                />
                <datalist id="lista-categorias-gasto">
                  {CATEGORIAS_SUGERIDAS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <Input
                label="Descripción (opcional)"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Factura de luz junio"
              />

              <div className="gg-contabilidad-grid-2">
                <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                <Input
                  label="Valor"
                  type="number"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="gg-field">
                <label htmlFor="metodo-pago-gasto">Método de pago</label>
                <select
                  id="metodo-pago-gasto"
                  className="gg-input"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPagoGasto)}
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" size="lg" disabled={mutacion.isPending}>
                {mutacion.isPending ? (
                  <>
                    <Loader2 size={18} className="gg-spin" />
                    Guardando…
                  </>
                ) : (
                  'Guardar gasto'
                )}
              </Button>

              {(error || mutacion.isError) && (
                <p className="gg-field-error">
                  {error ||
                    (mutacion.error instanceof ApiError
                      ? mutacion.error.message
                      : 'No pudimos guardar el gasto.')}
                </p>
              )}
            </form>
          </Card>

          <Card className="gg-gasto-historial-card">
            <h2 className="gg-contabilidad-subtitulo-h2">Gastos registrados</h2>

            {isLoading && <p className="gg-contabilidad-estado">Cargando…</p>}
            {isError && <p className="gg-contabilidad-estado">No pudimos cargar los gastos.</p>}
            {!isLoading && !isError && gastos?.length === 0 && (
              <p className="gg-contabilidad-estado">Todavía no hay gastos registrados.</p>
            )}

            {!isLoading && !isError && gastos && gastos.length > 0 && (
              <ul className="gg-gasto-lista">
                {gastos.map((g) => (
                  <li key={g.id} className="gg-gasto-item">
                    <ReceiptText size={18} className="gg-gasto-item-icono" />
                    <div className="gg-gasto-item-info">
                      <div className="gg-gasto-item-linea1">
                        <span className="gg-gasto-item-descripcion">
                          {g.categoria}
                          {g.descripcion ? ` — ${g.descripcion}` : ''}
                        </span>
                        <span className="gg-gasto-item-valor">{formatoCOP.format(g.valor)}</span>
                      </div>
                      <div className="gg-gasto-item-linea2">
                        <span>{formatoFecha(g.fecha)}</span>
                        <span>
                          · {METODOS_PAGO.find((m) => m.value === g.metodoPago)?.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="gg-gasto-item-eliminar"
                      onClick={() => handleEliminar(g.id)}
                      disabled={eliminando === g.id}
                      aria-label="Eliminar gasto"
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
