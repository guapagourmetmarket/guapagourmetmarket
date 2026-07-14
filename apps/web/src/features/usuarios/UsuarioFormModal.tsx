import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ApiError, actualizarUsuario, crearUsuario, type Rol, type Usuario } from '../../lib/api'
import './usuarios.css'

interface UsuarioFormModalProps {
  usuario?: Usuario | null
  onClose: () => void
}

const ROLES: { value: Rol; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'contador', label: 'Contador' },
  { value: 'supervisor', label: 'Supervisor' },
]

export function UsuarioFormModal({ usuario, onClose }: UsuarioFormModalProps) {
  const queryClient = useQueryClient()
  const editando = Boolean(usuario)

  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? 'cajero')
  const [error, setError] = useState('')
  const [passwordProvisional, setPasswordProvisional] = useState('')
  const [copiado, setCopiado] = useState(false)

  const mutacionCrear = useMutation({
    mutationFn: crearUsuario,
    onSuccess: (creado) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setPasswordProvisional(creado.passwordProvisional)
    },
  })

  const mutacionEditar = useMutation({
    // Solo se manda lo que realmente cambió: el backend bloquea que un
    // administrador se quite su propio rol, y mandar el mismo rol sin
    // querer cambiarlo (p. ej. al solo editar el nombre) activaría ese
    // bloqueo por error.
    mutationFn: () => {
      const cambios: { nombre?: string; rol?: Rol } = {}
      if (nombre.trim() !== usuario!.nombre) cambios.nombre = nombre.trim()
      if (rol !== usuario!.rol) cambios.rol = rol
      return actualizarUsuario(usuario!.id, cambios)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      onClose()
    },
  })

  const mutacion = editando ? mutacionEditar : mutacionCrear

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (editando) {
      if (nombre.trim() === usuario!.nombre && rol === usuario!.rol) {
        setError('No hay ningún cambio para guardar.')
        return
      }
      mutacionEditar.mutate()
      return
    }
    if (!email.trim()) {
      setError('El correo es obligatorio.')
      return
    }
    mutacionCrear.mutate({ nombre: nombre.trim(), email: email.trim(), rol })
  }

  async function copiarPassword() {
    await navigator.clipboard.writeText(passwordProvisional)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (passwordProvisional) {
    return (
      <Modal title="Cuenta creada" onClose={onClose}>
        <p className="gg-usuario-form-nota">
          Comparte esta contraseña provisional con <strong>{nombre}</strong> — solo se muestra una vez.
          Puede cambiarla luego desde "Mi cuenta".
        </p>
        <div className="gg-usuario-password-caja">
          <span className="gg-usuario-password-valor">{passwordProvisional}</span>
          <button type="button" className="gg-usuario-password-copiar" onClick={copiarPassword}>
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

  return (
    <Modal title={editando ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="gg-usuario-form">
        <Input
          label="Nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: María Pérez"
          autoFocus
        />
        {editando ? (
          <Input label="Correo" type="email" value={email} disabled />
        ) : (
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@guapagourmet.com"
          />
        )}
        <div className="gg-field">
          <label htmlFor="rol-usuario">Rol</label>
          <select
            id="rol-usuario"
            className="gg-input"
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {!editando && (
          <p className="gg-usuario-form-nota">
            Se genera una contraseña provisional automáticamente; la verás al guardar.
          </p>
        )}

        <div className="gg-usuario-acciones-form">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutacion.isPending}>
            {mutacion.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>

        {(error || mutacion.isError) && (
          <p className="gg-field-error">
            {error ||
              (mutacion.error instanceof ApiError
                ? mutacion.error.message
                : 'No pudimos guardar el usuario. Intenta de nuevo.')}
          </p>
        )}
      </form>
    </Modal>
  )
}
