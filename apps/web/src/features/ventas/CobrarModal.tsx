import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Sparkles } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { CalculadoraEfectivo } from '../../components/CalculadoraEfectivo'
import { useCarrito } from '../../lib/carrito'
import { ApiError, obtenerClientes, type MetodoPago, type Venta } from '../../lib/api'
import { registrarVentaConSync } from '../../lib/sync'
import { useDescuento } from './descuento'
import { LineaCarritoItem } from './LineaCarritoItem'
import { CuponInput } from './CuponInput'
import './ventas.css'

interface CobrarModalProps {
  onClose: () => void
  onVentaRegistrada: (venta: Venta) => void
}

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'mixto', label: 'Mixto' },
]

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function CobrarModal({ onClose, onVentaRegistrada }: CobrarModalProps) {
  const carrito = useCarrito()
  const queryClient = useQueryClient()
  const [cliente, setCliente] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [fiado, setFiado] = useState(false)
  const [fechaVencimientoPago, setFechaVencimientoPago] = useState('')
  const descuento = useDescuento(carrito.total)

  const { data: clientes } = useQuery({ queryKey: ['clientes', false], queryFn: () => obtenerClientes(false) })

  const clienteSeleccionado = useMemo(
    () => clientes?.find((c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase()),
    [clientes, cliente],
  )

  const mutacion = useMutation({
    mutationFn: registrarVentaConSync,
    onSuccess: (venta) => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      carrito.vaciar()
      descuento.reiniciar()
      onVentaRegistrada(venta)
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (carrito.lineas.length === 0) return
    mutacion.mutate({
      clienteId: clienteSeleccionado?.id,
      clienteNombre: cliente.trim() || undefined,
      descuento: descuento.monto || undefined,
      metodoPago,
      fiado: clienteSeleccionado ? fiado : undefined,
      fechaVencimientoPago: clienteSeleccionado && fiado ? fechaVencimientoPago || undefined : undefined,
      items: carrito.lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
    })
  }

  return (
    <Modal title="Cobrar" onClose={onClose}>
      <ul className="gg-carrito-lista">
        {carrito.lineas.map((linea) => (
          <LineaCarritoItem key={linea.producto.id} linea={linea} />
        ))}
      </ul>

      <form onSubmit={handleSubmit} noValidate className="gg-venta-form" style={{ marginTop: 16 }}>
        <div className="gg-field">
          <label htmlFor="cliente-cobrar">Cliente (opcional)</label>
          <input
            id="cliente-cobrar"
            className="gg-input"
            list="lista-clientes-cobrar"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nombre del cliente"
            autoComplete="off"
          />
          <datalist id="lista-clientes-cobrar">
            {clientes?.map((c) => <option key={c.id} value={c.nombre} />)}
          </datalist>
        </div>

        {clienteSeleccionado && (
          <div className="gg-venta-cliente-info">
            <span className="gg-cliente-puntos-chip">
              <Sparkles size={12} />
              {clienteSeleccionado.puntos} puntos
            </span>
            <label className="gg-toggle-desactivados">
              <input type="checkbox" checked={fiado} onChange={(e) => setFiado(e.target.checked)} />
              Venta fiada (a crédito)
            </label>
            {fiado && (
              <Input
                label="Vence el pago"
                type="date"
                value={fechaVencimientoPago}
                onChange={(e) => setFechaVencimientoPago(e.target.value)}
              />
            )}
          </div>
        )}

        <div className="gg-field">
          <label htmlFor="metodo-pago-cobrar">Método de pago</label>
          <select
            id="metodo-pago-cobrar"
            className="gg-input"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
          >
            {METODOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <CuponInput
          onAplicar={(pct) => {
            descuento.setTipo('porcentaje')
            descuento.setEntrada(String(pct))
          }}
          onQuitar={() => descuento.setEntrada('')}
        />

        <div className="gg-field">
          <label htmlFor="descuento-cobrar">Descuento (opcional)</label>
          <div className="gg-venta-descuento">
            <input
              id="descuento-cobrar"
              className="gg-input"
              type="number"
              min="0"
              value={descuento.entrada}
              onChange={(e) => descuento.setEntrada(e.target.value)}
              placeholder="0"
            />
            <select
              className="gg-input"
              value={descuento.tipo}
              onChange={(e) => descuento.setTipo(e.target.value as 'porcentaje' | 'valor')}
              aria-label="Tipo de descuento"
            >
              <option value="porcentaje">%</option>
              <option value="valor">$</option>
            </select>
          </div>
        </div>

        {descuento.monto > 0 && (
          <div className="gg-venta-subtotal">
            <span>Subtotal</span>
            <span>{formatoCOP.format(carrito.total)}</span>
          </div>
        )}
        {descuento.monto > 0 && (
          <div className="gg-venta-subtotal">
            <span>Descuento</span>
            <span>−{formatoCOP.format(descuento.monto)}</span>
          </div>
        )}

        <div className="gg-venta-total">
          <span>Total</span>
          <span>{formatoCOP.format(descuento.total)}</span>
        </div>

        {metodoPago === 'efectivo' && <CalculadoraEfectivo total={descuento.total} />}

        <Button type="submit" size="lg" disabled={mutacion.isPending || carrito.lineas.length === 0}>
          {mutacion.isPending ? (
            <>
              <Loader2 size={18} className="gg-spin" />
              Cobrando…
            </>
          ) : (
            'Confirmar venta'
          )}
        </Button>

        {mutacion.isError && (
          <p className="gg-field-error">
            {mutacion.error instanceof ApiError
              ? mutacion.error.message
              : 'No pudimos registrar la venta. Intenta de nuevo.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
