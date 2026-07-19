import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Modal } from './Modal'
import { Button } from './Button'
import './recortar-foto.css'

interface RecortarFotoModalProps {
  archivo: File
  aspecto?: number
  onConfirmar: (archivoRecortado: File) => void
  onCancelar: () => void
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('No pudimos leer esa imagen.')))
    img.src = url
  })
}

async function recortarImagen(urlImagen: string, area: Area, nombreArchivo: string, tipo: string): Promise<File> {
  const imagen = await cargarImagen(urlImagen)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Este navegador no puede recortar imágenes.')
  ctx.drawImage(imagen, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No pudimos recortar la imagen.'))
          return
        }
        resolve(new File([blob], nombreArchivo, { type: tipo }))
      },
      tipo,
      0.92,
    )
  })
}

/** Encuadrar/recortar una foto antes de agregarla al producto — misma proporción con la que se ve en las tarjetas. */
export function RecortarFotoModal({ archivo, aspecto = 4 / 3, onConfirmar, onCancelar }: RecortarFotoModalProps) {
  const [urlImagen] = useState(() => URL.createObjectURL(archivo))
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaRecorte, setAreaRecorte] = useState<Area | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  const onCropComplete = useCallback((_areaPorcentaje: Area, areaPixeles: Area) => {
    setAreaRecorte(areaPixeles)
  }, [])

  function cancelar() {
    URL.revokeObjectURL(urlImagen)
    onCancelar()
  }

  async function confirmar() {
    if (!areaRecorte) return
    setProcesando(true)
    setError('')
    try {
      const recortado = await recortarImagen(urlImagen, areaRecorte, archivo.name, archivo.type || 'image/jpeg')
      URL.revokeObjectURL(urlImagen)
      onConfirmar(recortado)
    } catch {
      setError('No pudimos recortar esta foto. Intenta de nuevo.')
      setProcesando(false)
    }
  }

  return (
    <Modal title="Encuadrar foto" onClose={cancelar}>
      <div className="gg-recortar-foto">
        <div className="gg-recortar-foto-lienzo">
          <Cropper
            image={urlImagen}
            crop={crop}
            zoom={zoom}
            minZoom={0.5}
            maxZoom={3}
            aspect={aspecto}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="gg-recortar-foto-zoom">
          Zoom
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>

        <p className="gg-recortar-foto-ayuda">
          Arrastra la foto para moverla en cualquier dirección y usa el zoom para acercarla o
          alejarla — así eliges qué parte se ve en la tarjeta del producto.
        </p>

        {error && <p className="gg-field-error">{error}</p>}

        <div className="gg-recortar-foto-acciones">
          <Button type="button" variant="secondary" onClick={cancelar} disabled={procesando}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar} disabled={!areaRecorte || procesando}>
            {procesando ? 'Recortando…' : 'Usar esta foto'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
