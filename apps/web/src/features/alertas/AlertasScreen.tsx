import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarClock, PackageX, TriangleAlert } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { obtenerAlertas } from '../../lib/api'
import './alertas.css'

interface AlertasScreenProps {
  onCerrarSesion: () => void
}

const formatoFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function AlertasScreen({ onCerrarSesion }: AlertasScreenProps) {
  const { data: alertas, isLoading, isError } = useQuery({
    queryKey: ['inventario', 'alertas'],
    queryFn: obtenerAlertas,
  })

  const totalAlertas = (alertas?.stockBajo.length ?? 0) + (alertas?.porVencer.length ?? 0)

  return (
    <div className="gg-alertas-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-alertas-main">
        <h1 className="font-display gg-alertas-title">Alertas</h1>
        <p className="gg-alertas-subtitulo">
          Lo que necesita tu atención hoy: productos por agotarse y lotes cerca de vencer.
        </p>

        {isLoading && (
          <Card className="gg-alertas-estado">
            <p>Cargando alertas…</p>
          </Card>
        )}
        {isError && (
          <Card className="gg-alertas-estado">
            <p>No pudimos cargar las alertas.</p>
          </Card>
        )}

        {!isLoading && !isError && alertas && totalAlertas === 0 && (
          <Card className="gg-alertas-vacio">
            <TriangleAlert size={28} strokeWidth={1.5} />
            <p>Todo en orden. No hay productos con stock bajo ni lotes por vencer.</p>
          </Card>
        )}

        {!isLoading && !isError && alertas && alertas.stockBajo.length > 0 && (
          <section className="gg-alertas-seccion">
            <h2 className="gg-alertas-seccion-titulo">
              <PackageX size={18} />
              Stock bajo ({alertas.stockBajo.length})
            </h2>
            <div className="gg-alertas-lista">
              {alertas.stockBajo.map((a) => (
                <Card key={a.productoId} className="gg-alerta-card">
                  <div>
                    <p className="gg-alerta-categoria">{a.categoriaNombre}</p>
                    <p className="gg-alerta-nombre">{a.nombre}</p>
                  </div>
                  <div className="gg-alerta-cifras">
                    <span className={a.existencias === 0 ? 'gg-alerta-cifra gg-alerta-cifra--critica' : 'gg-alerta-cifra'}>
                      {a.existencias} en stock
                    </span>
                    <span className="gg-alerta-cifra-meta">mínimo {a.stockMinimo}</span>
                  </div>
                  <Link to={`/productos/${a.productoId}/editar`} className="gg-alerta-accion">
                    Ver producto
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}

        {!isLoading && !isError && alertas && alertas.porVencer.length > 0 && (
          <section className="gg-alertas-seccion">
            <h2 className="gg-alertas-seccion-titulo">
              <CalendarClock size={18} />
              Por vencer ({alertas.porVencer.length})
            </h2>
            <div className="gg-alertas-lista">
              {alertas.porVencer.map((a) => (
                <Card key={a.loteId} className="gg-alerta-card">
                  <div>
                    <p className="gg-alerta-categoria">{a.codigoLote ? `Lote ${a.codigoLote}` : 'Sin código de lote'}</p>
                    <p className="gg-alerta-nombre">{a.productoNombre}</p>
                  </div>
                  <div className="gg-alerta-cifras">
                    <span className={a.diasRestantes < 0 ? 'gg-alerta-cifra gg-alerta-cifra--critica' : 'gg-alerta-cifra'}>
                      {a.diasRestantes < 0
                        ? `Venció hace ${Math.abs(a.diasRestantes)} día${Math.abs(a.diasRestantes) === 1 ? '' : 's'}`
                        : a.diasRestantes === 0
                          ? 'Vence hoy'
                          : `Vence en ${a.diasRestantes} día${a.diasRestantes === 1 ? '' : 's'}`}
                    </span>
                    <span className="gg-alerta-cifra-meta">
                      {formatoFecha(a.fechaVencimiento)} · {a.cantidadActual} unidades
                    </span>
                  </div>
                  <Link to={`/productos/${a.productoId}/editar`} className="gg-alerta-accion">
                    Ver producto
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
