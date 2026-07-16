import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, Trash2 } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { useEscaneoCodigoBarras } from '../../lib/useEscaneoCodigoBarras'
import {
  ApiError,
  agregarItemCuenta,
  buscarProductos,
  cancelarCuenta,
  cerrarCuenta,
  obtenerClientes,
  quitarItemCuenta,
  type CuentaAbierta,
  type MetodoPago,
  type Venta,
} from '../../lib/api'
import '../ventas/ventas.css'
import '../contabilidad/contabilidad.css'
import './cuentas.css'

interface CuentaDetalleModalProps {
  cuenta: CuentaAbierta
  onClose: () => void
  onCerrada: (venta: Venta) => void
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

export function CuentaDetalleModal({ cuenta, onClose, onCerrada }: CuentaDetalleModalProps) {
  const queryClient = useQueryClient()
  const [termino, setTermino] = useState('')
  const [cobrando, setCobrando] = useState(false)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [descuento, setDescuento] = useState('')
  const [cliente, setCliente] = useState('')
  const [error, setError] = useState('')

  const { data: clientes } = useQuery({ queryKey: ['clientes', false], queryFn: () => obtenerClientes(false) })

  const { data: sugerencias } = useQuery({
    queryKey: ['productos', 'buscar', termino],
    queryFn: () => buscarProductos(termino),
    enabled: termino.trim().length >= 2,
  })

  function invalidarCuentas() {
    queryClient.invalidateQueries({ queryKey: ['cuentas'] })
  }

  const mutacionAgregar = useMutation({
    mutationFn: (productoId: string) => agregarItemCuenta(cuenta.id, { productoId, cantidad: 1 }),
    onSuccess: invalidarCuentas,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'No pudimos agregar el producto.'),
  })

  const mutacionQuitar = useMutation({
    mutationFn: (itemId: string) => quitarItemCuenta(cuenta.id, itemId),
    onSuccess: invalidarCuentas,
  })

  const mutacionCerrar = useMutation({
    mutationFn: () => {
      const clienteSeleccionado = clientes?.find(
        (c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase(),
      )
      return cerrarCuenta(cuenta.id, {
        metodoPago,
        descuento: descuento.trim() ? Number(descuento) : undefined,
        clienteId: clienteSeleccionado?.id,
      })
    },
    onSuccess: (venta) => {
      invalidarCuentas()
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      onCerrada(venta)
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'No pudimos cobrar la cuenta.'),
  })

  const mutacionCancelar = useMutation({
    mutationFn: () => cancelarCuenta(cuenta.id),
    onSuccess: () => {
      invalidarCuentas()
      onClose()
    },
  })

  async function manejarEscaneo(codigo: string) {
    setTermino('')
    try {
      const resultados = await buscarProductos(codigo)
      const exacto = resultados.find((p) => p.codigoBarras === codigo || p.codigoInterno === codigo)
      if (exacto) {
        mutacionAgregar.mutate(exacto.id)
        return
      }
      if (resultados.length === 1) {
        mutacionAgregar.mutate(resultados[0].id)
        return
      }
      setError(`No encontramos un producto con el código "${codigo}".`)
    } catch {
      setError('No pudimos buscar ese código.')
    }
  }

  const { inputRef, handleKeyDown } = useEscaneoCodigoBarras(manejarEscaneo)

  function handleCancelarCuenta() {
    if (window.confirm(`¿Cancelar la cuenta de "${cuenta.nombre}" sin cobrar nada? No se puede deshacer.`)) {
      mutacionCancelar.mutate()
    }
  }

  return (
    <Modal title={`Cuenta de ${cuenta.nombre}`} onClose={onClose}>
      <div className="gg-cuenta-buscador">
        <Search size={18} className="gg-cuenta-buscador-icono" />
        <input
          ref={inputRef}
          type="text"
          className="gg-input"
          placeholder="Escanea el código o escribe el nombre del producto…"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {sugerencias && sugerencias.length > 0 && termino.trim().length >= 2 && (
          <ul className="gg-venta-sugerencias">
            {sugerencias.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    mutacionAgregar.mutate(p.id)
                    setTermino('')
                  }}
                >
                  <span>{p.nombre}</span>
                  <span className="gg-venta-sugerencia-precio">{formatoCOP.format(p.precioVenta)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cuenta.items.length === 0 ? (
        <p className="gg-contabilidad-estado">Todavía no le has agregado nada a esta cuenta.</p>
      ) : (
        <ul className="gg-cuenta-items">
          {cuenta.items.map((item) => (
            <li key={item.id} className="gg-cuenta-item">
              <span className="gg-cuenta-item-nombre">
                {item.cantidad}x {item.nombre}
              </span>
              <span className="gg-cuenta-item-subtotal">{formatoCOP.format(item.subtotal)}</span>
              <button
                type="button"
                className="gg-carrito-linea-quitar"
                onClick={() => mutacionQuitar.mutate(item.id)}
                aria-label="Quitar item"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="gg-venta-total" style={{ marginTop: 12 }}>
        <span>Total</span>
        <span>{formatoCOP.format(cuenta.total)}</span>
      </div>

      {!cobrando ? (
        <div className="gg-cuenta-acciones">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancelarCuenta}
            disabled={mutacionCancelar.isPending}
          >
            Cancelar cuenta
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={cuenta.items.length === 0}
            onClick={() => setCobrando(true)}
          >
            Cobrar
          </Button>
        </div>
      ) : (
        <div className="gg-cuenta-cobro">
          <div className="gg-field">
            <label htmlFor="cliente-cuenta">Cliente (opcional)</label>
            <input
              id="cliente-cuenta"
              className="gg-input"
              list="lista-clientes-cuenta"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
              autoComplete="off"
            />
            <datalist id="lista-clientes-cuenta">
              {clientes?.map((c) => <option key={c.id} value={c.nombre} />)}
            </datalist>
          </div>
          <div className="gg-field">
            <label htmlFor="metodo-pago-cuenta">Método de pago</label>
            <select
              id="metodo-pago-cuenta"
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
          <Input
            label="Descuento (opcional, en $)"
            type="number"
            min="0"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            placeholder="0"
          />
          <Button type="button" size="lg" disabled={mutacionCerrar.isPending} onClick={() => mutacionCerrar.mutate()}>
            {mutacionCerrar.isPending ? (
              <>
                <Loader2 size={18} className="gg-spin" />
                Cobrando…
              </>
            ) : (
              'Confirmar cobro'
            )}
          </Button>
        </div>
      )}

      {(error || mutacionCerrar.isError) && (
        <p className="gg-field-error">
          {error ||
            (mutacionCerrar.error instanceof ApiError
              ? mutacionCerrar.error.message
              : 'No pudimos cobrar la cuenta.')}
        </p>
      )}
    </Modal>
  )
}
