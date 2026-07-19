import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import './escanear-camara.css'

export interface EscanearCamaraHandle {
  /** Vuelve a activar la cámara después de que se detuvo por un código detectado. */
  reanudar: () => void
}

interface EscanearCamaraProps {
  /** Se llama una vez por cada código detectado; la cámara se detiene sola hasta que se llama `reanudar()`. */
  onDetectado: (codigo: string) => void
}

type Estado = 'iniciando' | 'escaneando' | 'sin-camara'

/** Vista de cámara con lectura continua de código de barras/QR (funciona igual en Safari/iPhone que en Chrome/Android). */
export const EscanearCamara = forwardRef<EscanearCamaraHandle, EscanearCamaraProps>(function EscanearCamara(
  { onDetectado },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [estado, setEstado] = useState<Estado>('iniciando')

  function detener() {
    controlsRef.current?.stop()
    controlsRef.current = null
  }

  function iniciar() {
    const reader = new BrowserMultiFormatReader()
    setEstado('iniciando')
    reader
      .decodeFromConstraints({ video: { facingMode: 'environment' } }, videoRef.current!, (resultado) => {
        if (!resultado) return
        detener()
        onDetectado(resultado.getText())
      })
      .then((controls) => {
        controlsRef.current = controls
        setEstado('escaneando')
      })
      .catch(() => setEstado('sin-camara'))
  }

  useImperativeHandle(ref, () => ({ reanudar: iniciar }))

  useEffect(() => {
    iniciar()
    return () => detener()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="gg-escanear-camara">
      <video ref={videoRef} className="gg-escanear-video" muted playsInline />
      {estado === 'escaneando' && <div className="gg-escanear-marco" />}
      {estado === 'iniciando' && (
        <div className="gg-escanear-overlay">
          <p>Activando la cámara…</p>
        </div>
      )}
      {estado === 'sin-camara' && (
        <div className="gg-escanear-overlay">
          <AlertTriangle size={28} />
          <p>No pudimos usar la cámara. Revisa que le hayas dado permiso a este sitio.</p>
          <Button type="button" variant="secondary" onClick={iniciar}>
            Intentar de nuevo
          </Button>
        </div>
      )}
    </div>
  )
})
