import { Printer } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { ReciboVenta } from './ReciboVenta'
import type { Negocio, Venta } from '../../lib/api'

interface ReciboModalProps {
  venta: Venta
  negocio: Negocio | null | undefined
  onClose: () => void
}

export function ReciboModal({ venta, negocio, onClose }: ReciboModalProps) {
  return (
    <Modal title={`Recibo No. ${venta.numero}`} onClose={onClose}>
      <ReciboVenta venta={venta} negocio={negocio} />
      <Button
        type="button"
        className="gg-recibo-boton-imprimir"
        onClick={() => window.print()}
        style={{ width: '100%', marginTop: 20 }}
      >
        <Printer size={18} />
        Imprimir recibo
      </Button>
    </Modal>
  )
}
