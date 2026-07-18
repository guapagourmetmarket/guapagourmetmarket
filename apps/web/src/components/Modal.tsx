import type { PropsWithChildren } from 'react'
import { X } from 'lucide-react'
import './components.css'

interface ModalProps extends PropsWithChildren {
  title: string
  onClose: () => void
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="gg-modal-overlay" onClick={onClose}>
      <div className="gg-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-header">
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <button type="button" className="gg-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="gg-modal-body">{children}</div>
      </div>
    </div>
  )
}
