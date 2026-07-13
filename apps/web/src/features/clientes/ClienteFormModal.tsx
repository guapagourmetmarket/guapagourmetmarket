import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ApiError, actualizarCliente, crearCliente, type Cliente } from '../../lib/api'
import './clientes.css'

interface ClienteFormModalProps {
  cliente?: Cliente | null
  onClose: () => void
}

export function ClienteFormModal({ cliente, onClose }: ClienteFormModalProps) {
  const queryClient = useQueryClient()
  const editando = Boolean(cliente)

  const [nombre, setNombre] = useState(cliente?.nombre ?? '')
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [direccion, setDireccion] = useState(cliente?.direccion ?? '')
  const [fechaNacimiento, setFechaNacimiento] = useState(cliente?.fechaNacimiento ?? '')
  const [error, setError] = useState('')

  const datos = () => ({
    nombre: nombre.trim(),
    telefono: telefono.trim() || undefined,
    email: email.trim() || undefined,
    direccion: direccion.trim() || undefined,
    fechaNacimiento: fechaNacimiento || undefined,
  })

  const mutacion = useMutation({
    mutationFn: () => (editando ? actualizarCliente(cliente!.id, datos()) : crearCliente(datos())),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) {
      setError('El nombre del cliente es obligatorio.')
      return
    }
    mutacion.mutate()
  }

  return (
    <Modal title={editando ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="gg-cliente-form">
        <Input
          label="Nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: María Fernanda Gómez"
          autoFocus
        />
        <div className="gg-cliente-grid">
          <Input
            label="Teléfono"
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
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

        <div className="gg-cliente-acciones">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutacion.isPending}>
            {mutacion.isPending ? 'Guardando…' : 'Guardar cliente'}
          </Button>
        </div>

        {(error || mutacion.isError) && (
          <p className="gg-field-error">
            {error ||
              (mutacion.error instanceof ApiError
                ? mutacion.error.message
                : 'No pudimos guardar el cliente. Intenta de nuevo.')}
          </p>
        )}
      </form>
    </Modal>
  )
}
