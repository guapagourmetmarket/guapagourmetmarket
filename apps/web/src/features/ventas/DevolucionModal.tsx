import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { ApiError, registrarDevolucion, type Venta } from '../../lib/api'

interface DevolucionModalProps {
  venta: Venta
  onClose: () => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function DevolucionModal({ venta, onClose }: DevolucionModalProps) {
  const queryClient = useQueryClient()
  const itemsDevolvibles = venta.items.filter((i) => i.cantidad - i.cantidadDevuelta > 0)

  const [itemId, setItemId] = useState(itemsDevolvibles[0]?.id ?? '')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  const itemSeleccionado = itemsDevolvibles.find((i) => i.id === itemId)
  const disponible = itemSeleccionado ? itemSeleccionado.cantidad - itemSeleccionado.cantidadDevuelta : 0

  const mutacion = useMutation({
    mutationFn: () => registrarDevolucion(itemId, Number(cantidad), motivo.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      onClose()
    },
  })

  function handleSubmit() {
    setError('')
    if (!itemId) {
      setError('Elige qué producto se devuelve.')
      return
    }
    const cant = Number(cantidad)
    if (!cantidad || cant <= 0) {
      setError('La cantidad debe ser mayor a cero.')
      return
    }
    if (cant > disponible) {
      setError(`Solo puedes devolver hasta ${disponible} de este producto.`)
      return
    }
    mutacion.mutate()
  }

  if (itemsDevolvibles.length === 0) {
    return (
      <Modal title="Devolver producto" onClose={onClose}>
        <p className="gg-contabilidad-estado">
          Esta venta no tiene productos de catálogo disponibles para devolver (ya se devolvió todo, o
          la venta fue de valor/descripción libre).
        </p>
      </Modal>
    )
  }

  return (
    <Modal title="Devolver producto" onClose={onClose}>
      <div className="gg-field">
        <label htmlFor="devolucion-producto">Producto</label>
        <select
          id="devolucion-producto"
          className="gg-input"
          value={itemId}
          onChange={(e) => {
            setItemId(e.target.value)
            setCantidad('')
          }}
        >
          {itemsDevolvibles.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombreProducto} (disponible: {i.cantidad - i.cantidadDevuelta})
            </option>
          ))}
        </select>
      </div>

      <div className="gg-field">
        <label htmlFor="devolucion-cantidad">Cantidad a devolver</label>
        <input
          id="devolucion-cantidad"
          className="gg-input"
          type="number"
          min="0"
          max={disponible}
          step="any"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="gg-field">
        <label htmlFor="devolucion-motivo">Motivo (opcional)</label>
        <input
          id="devolucion-motivo"
          className="gg-input"
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: producto dañado, cliente se arrepintió…"
        />
      </div>

      {itemSeleccionado && cantidad && Number(cantidad) > 0 && (
        <p className="gg-contabilidad-estado" style={{ textAlign: 'left' }}>
          Se repondrán {cantidad} unidades al inventario por{' '}
          {formatoCOP.format(itemSeleccionado.precioUnitario * Number(cantidad))}.
        </p>
      )}

      <Button type="button" size="lg" disabled={mutacion.isPending} onClick={handleSubmit} style={{ width: '100%', marginTop: 8 }}>
        {mutacion.isPending ? (
          <>
            <Loader2 size={18} className="gg-spin" />
            Registrando…
          </>
        ) : (
          'Registrar devolución'
        )}
      </Button>

      {(error || mutacion.isError) && (
        <p className="gg-field-error">
          {error ||
            (mutacion.error instanceof ApiError ? mutacion.error.message : 'No pudimos registrar la devolución.')}
        </p>
      )}
    </Modal>
  )
}
