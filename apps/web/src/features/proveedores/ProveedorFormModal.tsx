import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  ApiError,
  actualizarProveedor,
  crearProveedor,
  type Proveedor,
} from '../../lib/api'
import './proveedores.css'

interface ProveedorFormModalProps {
  proveedor?: Proveedor | null
  onClose: () => void
}

export function ProveedorFormModal({ proveedor, onClose }: ProveedorFormModalProps) {
  const queryClient = useQueryClient()
  const editando = Boolean(proveedor)

  const [nombre, setNombre] = useState(proveedor?.nombre ?? '')
  const [nit, setNit] = useState(proveedor?.nit ?? '')
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? '')
  const [email, setEmail] = useState(proveedor?.email ?? '')
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? '')
  const [condicionesPago, setCondicionesPago] = useState(proveedor?.condicionesPago ?? '')
  const [error, setError] = useState('')

  const datos = () => ({
    nombre: nombre.trim(),
    nit: nit.trim() || undefined,
    telefono: telefono.trim() || undefined,
    email: email.trim() || undefined,
    direccion: direccion.trim() || undefined,
    condicionesPago: condicionesPago.trim() || undefined,
  })

  const mutacion = useMutation({
    mutationFn: () =>
      editando ? actualizarProveedor(proveedor!.id, datos()) : crearProveedor(datos()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) {
      setError('El nombre del proveedor es obligatorio.')
      return
    }
    mutacion.mutate()
  }

  return (
    <Modal title={editando ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="gg-proveedor-form">
        <Input
          label="Nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Distribuidora Andina SAS"
          autoFocus
        />
        <div className="gg-proveedor-grid">
          <Input label="NIT" type="text" value={nit} onChange={(e) => setNit(e.target.value)} />
          <Input
            label="Teléfono"
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <Input
          label="Correo (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Dirección (opcional)"
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
        <Input
          label="Condiciones de pago (opcional)"
          type="text"
          value={condicionesPago}
          onChange={(e) => setCondicionesPago(e.target.value)}
          placeholder="Ej: Contado, 30 días…"
        />

        <div className="gg-proveedor-acciones">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutacion.isPending}>
            {mutacion.isPending ? 'Guardando…' : 'Guardar proveedor'}
          </Button>
        </div>

        {(error || mutacion.isError) && (
          <p className="gg-field-error">
            {error ||
              (mutacion.error instanceof ApiError
                ? mutacion.error.message
                : 'No pudimos guardar el proveedor. Intenta de nuevo.')}
          </p>
        )}
      </form>
    </Modal>
  )
}
