import { useRef, useState } from 'react'
import { ScanLine } from 'lucide-react'
import type { Producto } from '@guapa/shared'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { EscanearCamara, type EscanearCamaraHandle } from '../../components/EscanearCamara'

interface EscanearProductoModalProps {
  productos: Producto[]
  onEncontrado: (producto: Producto) => void
  onClose: () => void
}

/** Escanear con la cámara del computador o celular para identificar un producto ya cargado — mismo lector que usa la tienda pública. */
export function EscanearProductoModal({ productos, onEncontrado, onClose }: EscanearProductoModalProps) {
  const camaraRef = useRef<EscanearCamaraHandle>(null)
  const [codigoSinMatch, setCodigoSinMatch] = useState('')

  function manejarDetectado(codigo: string) {
    const encontrado = productos.find((p) => p.codigoBarras === codigo || p.codigoInterno === codigo)
    if (encontrado) {
      onEncontrado(encontrado)
    } else {
      setCodigoSinMatch(codigo)
    }
  }

  return (
    <Modal title="Escanear producto" onClose={onClose}>
      <EscanearCamara ref={camaraRef} onDetectado={manejarDetectado} />

      {codigoSinMatch && (
        <div className="gg-escanear-no-encontrado">
          <ScanLine size={22} />
          <p>No encontramos ningún producto con el código "{codigoSinMatch}".</p>
          <Button
            type="button"
            onClick={() => {
              setCodigoSinMatch('')
              camaraRef.current?.reanudar()
            }}
          >
            Seguir escaneando
          </Button>
        </div>
      )}
    </Modal>
  )
}
