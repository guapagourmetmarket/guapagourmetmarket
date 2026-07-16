import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { obtenerAuditoria } from '../../lib/api'
import '../contabilidad/contabilidad.css'
import './auditoria.css'

interface AuditoriaScreenProps {
  onCerrarSesion: () => void
}

const ETIQUETAS_ACCION: Record<string, string> = {
  eliminar_producto: 'Eliminó un producto',
  anular_venta: 'Anuló una venta',
  cambiar_rol_usuario: 'Cambió el rol de un usuario',
  cambiar_estado_usuario: 'Activó/desactivó un usuario',
  resetear_password_usuario: 'Reseteó la contraseña de un usuario',
  ajuste_inventario: 'Ajustó el inventario',
  eliminar_cupon: 'Eliminó un cupón',
  cancelar_cuenta: 'Canceló una cuenta abierta',
  devolucion: 'Registró una devolución',
}

function formatoFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditoriaScreen({ onCerrarSesion }: AuditoriaScreenProps) {
  const { data: registros, isLoading, isError } = useQuery({
    queryKey: ['auditoria'],
    queryFn: () => obtenerAuditoria(),
  })

  return (
    <div className="gg-contabilidad-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-contabilidad-main">
        <h1 className="font-display gg-contabilidad-title">Auditoría</h1>
        <p className="gg-contabilidad-subtitulo">
          Registro de acciones sensibles: quién eliminó, anuló, ajustó o cambió algo, y cuándo.
        </p>

        <Card style={{ marginTop: 16 }}>
          {isLoading && <p className="gg-contabilidad-estado">Cargando…</p>}
          {isError && <p className="gg-contabilidad-estado">No pudimos cargar la auditoría.</p>}
          {!isLoading && !isError && registros?.length === 0 && (
            <p className="gg-contabilidad-estado">Todavía no hay acciones registradas.</p>
          )}

          {!isLoading && !isError && registros && registros.length > 0 && (
            <ul className="gg-gasto-lista">
              {registros.map((r) => (
                <li key={r.id} className="gg-gasto-item">
                  <History size={18} className="gg-gasto-item-icono" />
                  <div className="gg-gasto-item-info">
                    <div className="gg-gasto-item-linea1">
                      <span className="gg-gasto-item-descripcion">
                        {r.usuarioNombre ?? 'Alguien'} — {ETIQUETAS_ACCION[r.accion] ?? r.accion}
                      </span>
                    </div>
                    <div className="gg-gasto-item-linea2">
                      <span>{formatoFechaHora(r.createdAt)}</span>
                      {r.detalle && <span>· {r.detalle}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  )
}
