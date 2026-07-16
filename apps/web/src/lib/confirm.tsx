import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import './confirm.css'

interface ConfirmOptions {
  titulo?: string
  textoConfirmar?: string
  peligro?: boolean
}

interface EstadoConfirm {
  mensaje: string
  opciones: ConfirmOptions
  resolver: (valor: boolean) => void
}

type FuncionConfirmar = (mensaje: string, opciones?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<FuncionConfirmar>(() => Promise.resolve(false))

/** Reemplaza window.confirm() por un modal con la marca — se monta una vez
 * cerca de la raíz de la app; cualquier pantalla llama useConfirm(). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoConfirm | null>(null)

  const confirmar = useCallback<FuncionConfirmar>((mensaje, opciones = {}) => {
    return new Promise<boolean>((resolve) => {
      setEstado({ mensaje, opciones, resolver: resolve })
    })
  }, [])

  function cerrar(valor: boolean) {
    estado?.resolver(valor)
    setEstado(null)
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {estado && (
        <Modal title={estado.opciones.titulo ?? 'Confirmar'} onClose={() => cerrar(false)}>
          <p className="gg-confirm-mensaje">{estado.mensaje}</p>
          <div className="gg-confirm-acciones">
            <Button type="button" variant="secondary" onClick={() => cerrar(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={estado.opciones.peligro ? 'danger' : 'primary'}
              onClick={() => cerrar(true)}
            >
              {estado.opciones.textoConfirmar ?? 'Confirmar'}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
