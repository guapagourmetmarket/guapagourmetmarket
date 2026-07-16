import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { suscribirseActualizacion } from '../lib/swUpdate'
import './actualizacion-banner.css'

/** Avisa (sin recargar sola) cuando hay una versión nueva publicada. */
export function ActualizacionBanner() {
  const [aplicar, setAplicar] = useState<(() => void) | null>(null)

  useEffect(() => suscribirseActualizacion((cb) => setAplicar(() => cb)), [])

  if (!aplicar) return null

  return (
    <div className="gg-actualizacion-banner">
      <RefreshCw size={16} />
      <span>Hay una versión nueva del sistema.</span>
      <button type="button" onClick={aplicar}>
        Actualizar ahora
      </button>
    </div>
  )
}
