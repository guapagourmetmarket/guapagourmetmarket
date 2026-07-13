import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'
import { ApiError, actualizarPerfil, obtenerPerfil } from '../lib/api'

interface MiCuentaModalProps {
  onClose: () => void
}

export function MiCuentaModal({ onClose }: MiCuentaModalProps) {
  const { data: perfil } = useQuery({ queryKey: ['perfil'], queryFn: obtenerPerfil })

  const [email, setEmail] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const mutacion = useMutation({
    mutationFn: actualizarPerfil,
    onSuccess: () => {
      setExito(true)
      setPasswordActual('')
      setPasswordNueva('')
      setConfirmarPassword('')
      setEmail('')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setExito(false)

    if (!passwordActual) {
      setError('Escribe tu contraseña actual para confirmar los cambios.')
      return
    }
    if (!email.trim() && !passwordNueva) {
      setError('Escribe un nuevo correo, una nueva contraseña, o ambos.')
      return
    }
    if (passwordNueva && passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (passwordNueva && passwordNueva !== confirmarPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    mutacion.mutate({
      passwordActual,
      email: email.trim() || undefined,
      passwordNueva: passwordNueva || undefined,
    })
  }

  return (
    <Modal title="Mi cuenta" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {perfil && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--c-muted)' }}>
            Correo actual: <strong>{perfil.email}</strong>
          </p>
        )}

        <Input
          label="Nuevo correo (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={perfil?.email}
        />
        <Input
          label="Nueva contraseña (opcional)"
          type="password"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
          placeholder="Déjalo vacío si no la vas a cambiar"
        />
        {passwordNueva && (
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
          />
        )}
        <Input
          label="Contraseña actual (para confirmar)"
          type="password"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          autoFocus
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" disabled={mutacion.isPending}>
            {mutacion.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>

        {exito && <p style={{ color: 'var(--c-sageDeep)', fontSize: 13, margin: 0 }}>Cambios guardados correctamente.</p>}
        {(error || mutacion.isError) && (
          <p className="gg-field-error">
            {error ||
              (mutacion.error instanceof ApiError
                ? mutacion.error.message
                : 'No pudimos guardar los cambios. Intenta de nuevo.')}
          </p>
        )}
      </form>
    </Modal>
  )
}
