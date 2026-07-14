import { useLiveQuery } from 'dexie-react-hooks'
import { CloudOff, RefreshCw } from 'lucide-react'
import { db } from '../lib/db'
import { sincronizarOutbox } from '../lib/sync'
import { useConexion } from '../lib/useConexion'
import './estado-conexion.css'

export function EstadoConexion() {
  const online = useConexion()
  const pendientes = useLiveQuery(() => db.outboxVentas.count(), [], 0)

  if (online && !pendientes) return null

  return (
    <div className={'gg-estado-conexion' + (online ? '' : ' gg-estado-conexion--offline')}>
      <CloudOff size={14} />
      {!online && <span>Sin conexión: las ventas se guardan en este dispositivo.</span>}
      {online && pendientes > 0 && (
        <span>
          Sincronizando {pendientes} venta{pendientes === 1 ? '' : 's'} pendiente
          {pendientes === 1 ? '' : 's'}…
        </span>
      )}
      {!online && pendientes > 0 && (
        <span className="gg-estado-conexion-contador">
          {pendientes} pendiente{pendientes === 1 ? '' : 's'} por sincronizar
        </span>
      )}
      {online && (
        <button type="button" onClick={() => sincronizarOutbox()} aria-label="Reintentar sincronización">
          <RefreshCw size={13} />
        </button>
      )}
    </div>
  )
}
