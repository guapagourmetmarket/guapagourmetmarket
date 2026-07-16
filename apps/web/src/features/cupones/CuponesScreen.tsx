import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Tag, Trash2 } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { SkeletonFila } from '../../components/Skeleton'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  ApiError,
  cambiarEstadoCupon,
  crearCupon,
  eliminarCupon,
  obtenerCupones,
} from '../../lib/api'
import { useConfirm } from '../../lib/confirm'
import '../contabilidad/contabilidad.css'
import './cupones.css'

interface CuponesScreenProps {
  onCerrarSesion: () => void
}

export function CuponesScreen({ onCerrarSesion }: CuponesScreenProps) {
  const queryClient = useQueryClient()
  const confirmar = useConfirm()
  const { data: cupones, isLoading, isError } = useQuery({ queryKey: ['cupones'], queryFn: obtenerCupones })

  const [codigo, setCodigo] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState<string | null>(null)

  const mutacion = useMutation({
    mutationFn: () => crearCupon(codigo.trim(), Number(porcentaje)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] })
      setCodigo('')
      setPorcentaje('')
      setError('')
    },
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => cambiarEstadoCupon(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cupones'] }),
  })

  const mutacionEliminar = useMutation({
    mutationFn: eliminarCupon,
    onMutate: (id) => setEliminando(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cupones'] }),
    onSettled: () => setEliminando(null),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (codigo.trim().length < 3) {
      setError('El código debe tener al menos 3 caracteres.')
      return
    }
    const pct = Number(porcentaje)
    if (!porcentaje || pct <= 0 || pct > 100) {
      setError('El % de descuento debe estar entre 1 y 100.')
      return
    }
    mutacion.mutate()
  }

  async function handleEliminar(id: string, codigoCupon: string) {
    const confirmado = await confirmar(`¿Eliminar el cupón "${codigoCupon}"? No se puede deshacer.`, {
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
            <h1 className="font-display gg-contabilidad-title">Nuevo cupón</h1>
            <p className="gg-contabilidad-subtitulo">
              Crea un código que tú o quien esté en caja puedan escribir al cobrar para aplicar un %
              de descuento a toda la venta. Desactívalo cuando quieras que deje de funcionar, sin
              borrarlo.
            </p>

            <form onSubmit={handleSubmit} noValidate className="gg-gasto-form">
              <Input
                label="Código"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: VERANO10"
              />
              <Input
                label="% de descuento"
                type="number"
                min="1"
                max="100"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                placeholder="10"
              />

              <Button type="submit" size="lg" disabled={mutacion.isPending}>
                {mutacion.isPending ? (
                  <>
                    <Loader2 size={18} className="gg-spin" />
                    Creando…
                  </>
                ) : (
                  'Crear cupón'
                )}
              </Button>

              {(error || mutacion.isError) && (
                <p className="gg-field-error">
                  {error ||
                    (mutacion.error instanceof ApiError
                      ? mutacion.error.message
                      : 'No pudimos crear el cupón.')}
                </p>
              )}
            </form>
          </Card>

          <Card>
            <h2 className="gg-contabilidad-subtitulo-h2">Cupones creados</h2>

            {isLoading && <SkeletonFila cantidad={3} />}
            {isError && <p className="gg-contabilidad-estado">No pudimos cargar los cupones.</p>}
            {!isLoading && !isError && cupones?.length === 0 && (
              <p className="gg-contabilidad-estado">Todavía no has creado ningún cupón.</p>
            )}

            {!isLoading && !isError && cupones && cupones.length > 0 && (
              <ul className="gg-gasto-lista">
                {cupones.map((c) => (
                  <li key={c.id} className="gg-gasto-item">
                    <Tag size={18} className="gg-gasto-item-icono" />
                    <div className="gg-gasto-item-info">
                      <div className="gg-gasto-item-linea1">
                        <span className="gg-gasto-item-descripcion">{c.codigo}</span>
                        <span className="gg-cupon-porcentaje">-{c.porcentaje}%</span>
                      </div>
                      <div className="gg-gasto-item-linea2">
                        <button
                          type="button"
                          className={'gg-cupon-estado' + (c.activo ? ' gg-cupon-estado--activo' : '')}
                          onClick={() => mutacionEstado.mutate({ id: c.id, activo: !c.activo })}
                          disabled={mutacionEstado.isPending}
                        >
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="gg-gasto-item-eliminar"
                      onClick={() => handleEliminar(c.id, c.codigo)}
                      disabled={eliminando === c.id}
                      aria-label="Eliminar cupón"
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
