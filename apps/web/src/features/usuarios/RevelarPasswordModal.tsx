import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import './usuarios.css'

interface RevelarPasswordModalProps {
  nombre: string
  password: string
  onClose: () => void
}

export function RevelarPasswordModal({ nombre, password, onClose }: RevelarPasswordModalProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(password)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Modal title="Nueva contraseña" onClose={onClose}>
      <p className="gg-usuario-form-nota">
        Comparte esta contraseña provisional con <strong>{nombre}</strong> — solo se muestra una vez.
      </p>
      <div className="gg-usuario-password-caja">
        <span className="gg-usuario-password-valor">{password}</span>
        <button type="button" className="gg-usuario-password-copiar" onClick={copiar}>
          {copiado ? <Check size={14} /> : <Copy size={14} />}
          {copiado ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <div className="gg-usuario-acciones-form">
        <Button type="button" onClick={onClose}>
          Listo
        </Button>
      </div>
    </Modal>
  )
}
