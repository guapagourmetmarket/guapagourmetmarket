import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { brand } from '../../theme/theme'
import {
  obtenerMargenProductos,
  obtenerResumenDashboard,
  obtenerTopProductos,
  obtenerVentasPorCategoria,
  obtenerVentasPorDia,
  obtenerVentasPorEmpleado,
} from '../../lib/api'
import './reportes.css'

interface ReportesScreenProps {
  onCerrarSesion: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const COLORES_TORTA = [
  brand.colors.sageDeep,
  brand.colors.roseDeep,
  brand.colors.warning,
  brand.colors.sage,
  brand.colors.rose,
  brand.colors.sand,
]

const hoy = () => new Date().toISOString().slice(0, 10)
const primerDiaDelMes = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const formatoFechaCorta = (fecha: string) => {
  const [, mes, dia] = fecha.split('-')
  return `${dia}/${mes}`
}

export function ReportesScreen({ onCerrarSesion }: ReportesScreenProps) {
  const [desde, setDesde] = useState(primerDiaDelMes())
  const [hasta, setHasta] = useState(hoy())

  const { data: resumen } = useQuery({
    queryKey: ['reportes', 'resumen'],
    queryFn: obtenerResumenDashboard,
  })

  const { data: ventasPorDia, isLoading: cargandoVentasDia } = useQuery({
    queryKey: ['reportes', 'ventas-por-dia', desde, hasta],
    queryFn: () => obtenerVentasPorDia(desde, hasta),
  })

  const { data: topProductos, isLoading: cargandoTop } = useQuery({
    queryKey: ['reportes', 'top-productos', desde, hasta],
    queryFn: () => obtenerTopProductos(desde, hasta, 'mas', 8),
  })

  const { data: menosVendidos } = useQuery({
    queryKey: ['reportes', 'menos-productos', desde, hasta],
    queryFn: () => obtenerTopProductos(desde, hasta, 'menos', 5),
  })

  const { data: ventasPorCategoria, isLoading: cargandoCategoria } = useQuery({
    queryKey: ['reportes', 'ventas-por-categoria', desde, hasta],
    queryFn: () => obtenerVentasPorCategoria(desde, hasta),
  })

  const { data: ventasPorEmpleado, isLoading: cargandoEmpleado } = useQuery({
    queryKey: ['reportes', 'ventas-por-empleado', desde, hasta],
    queryFn: () => obtenerVentasPorEmpleado(desde, hasta),
  })

  const { data: margenProductos, isLoading: cargandoMargen } = useQuery({
    queryKey: ['reportes', 'margen-productos', desde, hasta],
    queryFn: () => obtenerMargenProductos(desde, hasta, 8),
  })

  return (
    <div className="gg-reportes-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-reportes-main">
        <div className="gg-reportes-toolbar">
          <h1 className="font-display gg-reportes-title">Reportes</h1>
          <div className="gg-reportes-rango">
            <div className="gg-field">
              <label htmlFor="reportes-desde">Desde</label>
              <input
                id="reportes-desde"
                type="date"
                className="gg-input"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="gg-field">
              <label htmlFor="reportes-hasta">Hasta</label>
              <input
                id="reportes-hasta"
                type="date"
                className="gg-input"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="gg-reportes-resumen">
          <Card className="gg-resumen-card">
            <TrendingUp size={18} />
            <div>
              <p className="gg-resumen-valor">{formatoCOP.format(resumen?.ventasHoy ?? 0)}</p>
              <p className="gg-resumen-label">Ventas de hoy ({resumen?.cantidadVentasHoy ?? 0})</p>
            </div>
          </Card>
          <Card className="gg-resumen-card">
            <BarChart3 size={18} />
            <div>
              <p className="gg-resumen-valor">{formatoCOP.format(resumen?.ventasMes ?? 0)}</p>
              <p className="gg-resumen-label">Ventas del mes ({resumen?.cantidadVentasMes ?? 0})</p>
            </div>
          </Card>
        </div>

        <Card className="gg-reportes-grafico-card">
          <h2 className="gg-reportes-subtitulo">Ventas por día</h2>
          {cargandoVentasDia && <p className="gg-reportes-estado">Cargando…</p>}
          {!cargandoVentasDia && (ventasPorDia?.length ?? 0) === 0 && (
            <p className="gg-reportes-estado">Sin ventas en este rango.</p>
          )}
          {!cargandoVentasDia && ventasPorDia && ventasPorDia.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ventasPorDia}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={brand.colors.sageDeep} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={brand.colors.sageDeep} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={brand.colors.line} />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatoFechaCorta}
                  tick={{ fontSize: 12, fill: brand.colors.muted }}
                />
                <YAxis
                  tickFormatter={(v) => formatoCOP.format(v)}
                  tick={{ fontSize: 11, fill: brand.colors.muted }}
                  width={70}
                />
                <Tooltip
                  formatter={(value) => formatoCOP.format(Number(value))}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={brand.colors.sageDeep}
                  fill="url(#colorVentas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className="gg-reportes-columnas">
          <Card className="gg-reportes-grafico-card">
            <h2 className="gg-reportes-subtitulo">
              <ShoppingBag size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
              Más vendidos
            </h2>
            {cargandoTop && <p className="gg-reportes-estado">Cargando…</p>}
            {!cargandoTop && (topProductos?.length ?? 0) === 0 && (
              <p className="gg-reportes-estado">Sin ventas de productos en este rango.</p>
            )}
            {!cargandoTop && topProductos && topProductos.length > 0 && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProductos} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={brand.colors.line} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: brand.colors.muted }} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={110}
                    tick={{ fontSize: 11, fill: brand.colors.ink }}
                  />
                  <Tooltip formatter={(value) => `${value} unidades`} />
                  <Bar dataKey="cantidadVendida" fill={brand.colors.sageDeep} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="gg-reportes-grafico-card">
            <h2 className="gg-reportes-subtitulo">Ventas por categoría</h2>
            {cargandoCategoria && <p className="gg-reportes-estado">Cargando…</p>}
            {!cargandoCategoria && (ventasPorCategoria?.length ?? 0) === 0 && (
              <p className="gg-reportes-estado">Sin datos en este rango.</p>
            )}
            {!cargandoCategoria && ventasPorCategoria && ventasPorCategoria.length > 0 && (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={ventasPorCategoria}
                    dataKey="total"
                    nameKey="categoria"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {ventasPorCategoria.map((_, i) => (
                      <Cell key={i} fill={COLORES_TORTA[i % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatoCOP.format(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {!cargandoCategoria && ventasPorCategoria && ventasPorCategoria.length > 0 && (
              <ul className="gg-reportes-leyenda">
                {ventasPorCategoria.map((c, i) => (
                  <li key={c.categoria}>
                    <span
                      className="gg-reportes-leyenda-punto"
                      style={{ background: COLORES_TORTA[i % COLORES_TORTA.length] }}
                    />
                    {c.categoria} — {formatoCOP.format(c.total)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="gg-reportes-columnas">
          <Card className="gg-reportes-grafico-card">
            <h2 className="gg-reportes-subtitulo">
              <Users size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
              Ventas por empleado
            </h2>
            {cargandoEmpleado && <p className="gg-reportes-estado">Cargando…</p>}
            {!cargandoEmpleado && (ventasPorEmpleado?.length ?? 0) === 0 && (
              <p className="gg-reportes-estado">Sin datos en este rango.</p>
            )}
            {!cargandoEmpleado && ventasPorEmpleado && ventasPorEmpleado.length > 0 && (
              <ul className="gg-reportes-tabla">
                {ventasPorEmpleado.map((e) => (
                  <li key={e.usuarioId ?? e.usuario}>
                    <span>{e.usuario}</span>
                    <span className="gg-reportes-tabla-valor">{formatoCOP.format(e.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="gg-reportes-grafico-card">
            <h2 className="gg-reportes-subtitulo">Menos vendidos (baja rotación)</h2>
            {(menosVendidos?.length ?? 0) === 0 && (
              <p className="gg-reportes-estado">Sin datos en este rango.</p>
            )}
            {menosVendidos && menosVendidos.length > 0 && (
              <ul className="gg-reportes-tabla">
                {menosVendidos.map((p) => (
                  <li key={p.productoId}>
                    <span>{p.nombre}</span>
                    <span className="gg-reportes-tabla-valor">{p.cantidadVendida} und.</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="gg-reportes-grafico-card">
          <h2 className="gg-reportes-subtitulo">Margen por producto</h2>
          {cargandoMargen && <p className="gg-reportes-estado">Cargando…</p>}
          {!cargandoMargen && (margenProductos?.length ?? 0) === 0 && (
            <p className="gg-reportes-estado">Sin datos de costo en este rango.</p>
          )}
          {!cargandoMargen && margenProductos && margenProductos.length > 0 && (
            <div className="gg-reportes-tabla-scroll">
              <table className="gg-reportes-tabla-margen">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Ingresos</th>
                    <th>Costo</th>
                    <th>Margen</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {margenProductos.map((m) => (
                    <tr key={m.productoId}>
                      <td>{m.nombre}</td>
                      <td>{formatoCOP.format(m.ingresos)}</td>
                      <td>{formatoCOP.format(m.costo)}</td>
                      <td className={m.margen >= 0 ? 'gg-metrica-positivo' : 'gg-metrica-negativo'}>
                        {formatoCOP.format(m.margen)}
                      </td>
                      <td>{m.porcentajeMargen}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
