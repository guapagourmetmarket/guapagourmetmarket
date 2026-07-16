import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle2, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { SkeletonFila, SkeletonTabla } from '../../components/Skeleton'
import {
  marcarCompraPagada,
  marcarVentaPagada,
  obtenerCartera,
  obtenerCarteraClientes,
  obtenerEstadoResultados,
  obtenerFlujoCaja,
} from '../../lib/api'
import './contabilidad.css'

interface ContabilidadScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const hoy = () => new Date().toISOString().slice(0, 10)
const primerDiaDelMes = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const formatoFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function ContabilidadScreen({ onCerrarSesion }: ContabilidadScreenProps) {
  const queryClient = useQueryClient()
  const [desde, setDesde] = useState(primerDiaDelMes())
  const [hasta, setHasta] = useState(hoy())
  const [marcandoPago, setMarcandoPago] = useState<string | null>(null)
  const [marcandoCobro, setMarcandoCobro] = useState<string | null>(null)

  const { data: flujo, isLoading: cargandoFlujo } = useQuery({
    queryKey: ['contabilidad', 'flujo-caja', desde, hasta],
    queryFn: () => obtenerFlujoCaja(desde, hasta),
  })

  const { data: resultados, isLoading: cargandoResultados } = useQuery({
    queryKey: ['contabilidad', 'estado-resultados', desde, hasta],
    queryFn: () => obtenerEstadoResultados(desde, hasta),
  })

  const { data: cartera, isLoading: cargandoCartera } = useQuery({
    queryKey: ['compras', 'cartera'],
    queryFn: obtenerCartera,
  })

  const mutacionPagar = useMutation({
    mutationFn: marcarCompraPagada,
    onMutate: (id) => setMarcandoPago(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras', 'cartera'] })
      queryClient.invalidateQueries({ queryKey: ['contabilidad'] })
    },
    onSettled: () => setMarcandoPago(null),
  })

  const { data: carteraClientes, isLoading: cargandoCarteraClientes } = useQuery({
    queryKey: ['ventas', 'cartera'],
    queryFn: obtenerCarteraClientes,
  })

  const mutacionCobrar = useMutation({
    mutationFn: marcarVentaPagada,
    onMutate: (id) => setMarcandoCobro(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas', 'cartera'] })
      queryClient.invalidateQueries({ queryKey: ['contabilidad'] })
    },
    onSettled: () => setMarcandoCobro(null),
  })

  return (
    <div className="gg-contabilidad-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-contabilidad-main">
        <div className="gg-contabilidad-toolbar">
          <h1 className="font-display gg-contabilidad-title">Contabilidad</h1>
          <div className="gg-contabilidad-rango">
            <div className="gg-field">
              <label htmlFor="desde">Desde</label>
              <input
                id="desde"
                type="date"
                className="gg-input"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="gg-field">
              <label htmlFor="hasta">Hasta</label>
              <input
                id="hasta"
                type="date"
                className="gg-input"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="gg-contabilidad-tarjetas">
          <Card className="gg-metrica-card">
            <div className="gg-metrica-header">
              <Wallet size={18} />
              <span>Flujo de caja</span>
            </div>
            {cargandoFlujo || !flujo ? (
              <SkeletonTabla filas={4} columnas={2} />
            ) : (
              <>
                <div className="gg-metrica-fila">
                  <span>Ingresos por ventas</span>
                  <span className="gg-metrica-positivo">{formatoCOP.format(flujo.ingresosVentas)}</span>
                </div>
                <div className="gg-metrica-fila">
                  <span>Gastos</span>
                  <span className="gg-metrica-negativo">-{formatoCOP.format(flujo.gastos)}</span>
                </div>
                <div className="gg-metrica-fila">
                  <span>Compras pagadas</span>
                  <span className="gg-metrica-negativo">-{formatoCOP.format(flujo.comprasPagadas)}</span>
                </div>
                <div className="gg-metrica-fila gg-metrica-total">
                  <span>Flujo neto</span>
                  <span className={flujo.flujoNeto >= 0 ? 'gg-metrica-positivo' : 'gg-metrica-negativo'}>
                    {formatoCOP.format(flujo.flujoNeto)}
                  </span>
                </div>
              </>
            )}
          </Card>

          <Card className="gg-metrica-card">
            <div className="gg-metrica-header">
              {resultados && resultados.utilidadNeta >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              <span>Estado de resultados</span>
            </div>
            {cargandoResultados || !resultados ? (
              <SkeletonTabla filas={5} columnas={2} />
            ) : (
              <>
                <div className="gg-metrica-fila">
                  <span>Ingresos</span>
                  <span className="gg-metrica-positivo">{formatoCOP.format(resultados.ingresos)}</span>
                </div>
                <div className="gg-metrica-fila">
                  <span>Costo de ventas</span>
                  <span className="gg-metrica-negativo">-{formatoCOP.format(resultados.costoVentas)}</span>
                </div>
                <div className="gg-metrica-fila gg-metrica-subtotal">
                  <span>Utilidad bruta</span>
                  <span>{formatoCOP.format(resultados.utilidadBruta)}</span>
                </div>
                <div className="gg-metrica-fila">
                  <span>Gastos operativos</span>
                  <span className="gg-metrica-negativo">-{formatoCOP.format(resultados.gastosOperativos)}</span>
                </div>
                <div className="gg-metrica-fila gg-metrica-total">
                  <span>Utilidad neta</span>
                  <span className={resultados.utilidadNeta >= 0 ? 'gg-metrica-positivo' : 'gg-metrica-negativo'}>
                    {formatoCOP.format(resultados.utilidadNeta)}
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>

        <section className="gg-contabilidad-seccion">
          <h2 className="gg-contabilidad-subtitulo-h2">Cartera de proveedores (por pagar)</h2>

          {cargandoCartera && <SkeletonFila cantidad={3} />}
          {!cargandoCartera && cartera?.length === 0 && (
            <Card className="gg-contabilidad-estado-card">
              <CheckCircle2 size={22} />
              <p>No debes nada a tus proveedores en este momento.</p>
            </Card>
          )}

          {!cargandoCartera && cartera && cartera.length > 0 && (
            <div className="gg-cartera-lista">
              {cartera.map((c) => (
                <Card key={c.id} className="gg-cartera-card">
                  <div>
                    <p className="gg-cartera-proveedor">{c.proveedorNombre}</p>
                    <p className="gg-cartera-meta">
                      Compra No. {c.numero} · {formatoFecha(c.fecha)}
                      {c.fechaVencimientoPago && ` · Vence ${formatoFecha(c.fechaVencimientoPago)}`}
                    </p>
                  </div>
                  <span className="gg-cartera-valor">{formatoCOP.format(c.total)}</span>
                  <button
                    type="button"
                    className="gg-cartera-pagar"
                    onClick={() => mutacionPagar.mutate(c.id)}
                    disabled={marcandoPago === c.id}
                  >
                    {marcandoPago === c.id ? 'Guardando…' : 'Marcar pagada'}
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="gg-contabilidad-seccion">
          <h2 className="gg-contabilidad-subtitulo-h2">Cartera de clientes (por cobrar)</h2>

          {cargandoCarteraClientes && <SkeletonFila cantidad={3} />}
          {!cargandoCarteraClientes && carteraClientes?.length === 0 && (
            <Card className="gg-contabilidad-estado-card">
              <CheckCircle2 size={22} />
              <p>No tienes ventas fiadas pendientes de cobro.</p>
            </Card>
          )}

          {!cargandoCarteraClientes && carteraClientes && carteraClientes.length > 0 && (
            <div className="gg-cartera-lista">
              {carteraClientes.map((v) => (
                <Card key={v.id} className="gg-cartera-card">
                  <div>
                    <p className="gg-cartera-proveedor">{v.clienteNombre}</p>
                    <p className="gg-cartera-meta">
                      Venta No. {v.numero} · {formatoFecha(v.fecha)}
                      {v.fechaVencimientoPago && ` · Vence ${formatoFecha(v.fechaVencimientoPago)}`}
                    </p>
                  </div>
                  <span className="gg-cartera-valor">{formatoCOP.format(v.valor)}</span>
                  <button
                    type="button"
                    className="gg-cartera-pagar"
                    onClick={() => mutacionCobrar.mutate(v.id)}
                    disabled={marcandoCobro === v.id}
                  >
                    {marcandoCobro === v.id ? 'Guardando…' : 'Marcar cobrada'}
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <p className="gg-contabilidad-link-gastos">
          ¿Necesitas registrar un gasto? <Link to="/gastos">Ir a Gastos</Link>
        </p>
      </main>
    </div>
  )
}
