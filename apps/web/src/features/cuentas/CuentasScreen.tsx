import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Receipt } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { abrirCuenta, obtenerCuentas, obtenerNegocio, type CuentaAbierta, type Venta } from '../../lib/api'
import { CuentaDetalleModal } from './CuentaDetalleModal'
import { ReciboModal } from '../ventas/ReciboModal'
import '../contabilidad/contabilidad.css'
import './cuentas.css'

interface CuentasScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function CuentasScreen({ onCerrarSesion }: CuentasScreenProps) {
  const queryClient = useQueryClient()
  const { data: negocio } = useQuery({ queryKey: ['negocio'], queryFn: obtenerNegocio })
  const { data: cuentas, isLoading, isError } = useQuery({ queryKey: ['cuentas'], queryFn: obtenerCuentas })

  const [nombreNueva, setNombreNueva] = useState('')
  const [cuentaAbierta, setCuentaAbierta] = useState<CuentaAbierta | null>(null)
  const [reciboVenta, setReciboVenta] = useState<Venta | null>(null)

  const mutacionAbrir = useMutation({
    mutationFn: abrirCuenta,
    onSuccess: (nueva) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas'] })
      setNombreNueva('')
      setCuentaAbierta(nueva)
    },
  })

  function handleAbrir(e: FormEvent) {
    e.preventDefault()
    if (nombreNueva.trim().length < 2) return
    mutacionAbrir.mutate(nombreNueva.trim())
  }

  // La cuenta que se está viendo en el modal puede haber cambiado (items
  // agregados/quitados) desde que se abrió — siempre se busca la versión
  // más reciente en la lista en vez de guardar una copia que se desactualiza.
  const cuentaSeleccionada = cuentaAbierta
    ? (cuentas?.find((c) => c.id === cuentaAbierta.id) ?? cuentaAbierta)
    : null

  return (
    <div className="gg-contabilidad-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-contabilidad-main">
        <div className="gg-cuentas-toolbar">
          <div>
            <h1 className="font-display gg-contabilidad-title">Cuentas abiertas</h1>
            <p className="gg-contabilidad-subtitulo">
              Abre una cuenta por cada cliente que va pidiendo cosas mientras está en la tienda, y
              cóbrala completa cuando termine.
            </p>
          </div>
          <form onSubmit={handleAbrir} className="gg-cuenta-nueva-form">
            <input
              type="text"
              className="gg-input"
              placeholder="Nombre del cliente"
              value={nombreNueva}
              onChange={(e) => setNombreNueva(e.target.value)}
            />
            <Button type="submit" disabled={mutacionAbrir.isPending || nombreNueva.trim().length < 2}>
              {mutacionAbrir.isPending ? <Loader2 size={18} className="gg-spin" /> : <Plus size={18} />}
              Nueva cuenta
            </Button>
          </form>
        </div>

        {isLoading && <p className="gg-contabilidad-estado">Cargando…</p>}
        {isError && <p className="gg-contabilidad-estado">No pudimos cargar las cuentas.</p>}
        {!isLoading && !isError && cuentas?.length === 0 && (
          <p className="gg-contabilidad-estado">No hay cuentas abiertas en este momento.</p>
        )}

        {!isLoading && !isError && cuentas && cuentas.length > 0 && (
          <div className="gg-cuentas-grid">
            {cuentas.map((c) => (
              <Card key={c.id} className="gg-cuenta-card" onClick={() => setCuentaAbierta(c)}>
                <Receipt size={22} className="gg-cuenta-card-icono" />
                <span className="gg-cuenta-card-nombre">{c.nombre}</span>
                <span className="gg-cuenta-card-detalle">
                  {c.items.length} item{c.items.length === 1 ? '' : 's'}
                </span>
                <span className="gg-cuenta-card-total">{formatoCOP.format(c.total)}</span>
              </Card>
            ))}
          </div>
        )}
      </main>

      {cuentaSeleccionada && (
        <CuentaDetalleModal
          cuenta={cuentaSeleccionada}
          onClose={() => setCuentaAbierta(null)}
          onCerrada={(venta) => {
            setCuentaAbierta(null)
            setReciboVenta(venta)
          }}
        />
      )}

      {reciboVenta && (
        <ReciboModal venta={reciboVenta} negocio={negocio} onClose={() => setReciboVenta(null)} />
      )}
    </div>
  )
}
