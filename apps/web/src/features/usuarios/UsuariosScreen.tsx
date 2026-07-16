import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil, Plus, Power } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import {
  ApiError,
  actualizarUsuario,
  obtenerUsuarioSesion,
  obtenerUsuarios,
  resetearPasswordUsuario,
  type Usuario,
} from '../../lib/api'
import { UsuarioFormModal } from './UsuarioFormModal'
import { RevelarPasswordModal } from './RevelarPasswordModal'
import { useConfirm } from '../../lib/confirm'
import './usuarios.css'

interface UsuariosScreenProps {
  onCerrarSesion: () => void
}

const ROL_LABEL: Record<Usuario['rol'], string> = {
  administrador: 'Administrador',
  cajero: 'Cajero',
  contador: 'Contador',
  supervisor: 'Supervisor',
}

export function UsuariosScreen({ onCerrarSesion }: UsuariosScreenProps) {
  const queryClient = useQueryClient()
  const confirmar = useConfirm()
  const usuarioActual = obtenerUsuarioSesion()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [passwordReseteada, setPasswordReseteada] = useState<{ nombre: string; password: string } | null>(null)
  const [errorGeneral, setErrorGeneral] = useState('')

  const { data: usuarios, isLoading, isError } = useQuery({
    queryKey: ['usuarios'],
    queryFn: obtenerUsuarios,
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actualizarUsuario(id, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
    onError: (err) =>
      setErrorGeneral(err instanceof ApiError ? err.message : 'No pudimos actualizar el usuario.'),
  })

  const mutacionReset = useMutation({
    mutationFn: resetearPasswordUsuario,
    onError: (err) =>
      setErrorGeneral(err instanceof ApiError ? err.message : 'No pudimos resetear la contraseña.'),
  })

  function abrirNuevo() {
    setUsuarioEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(u: Usuario) {
    setUsuarioEditando(u)
    setModalAbierto(true)
  }

  async function handleDesactivar(u: Usuario) {
    const confirmado = await confirmar(`¿Desactivar a "${u.nombre}"? Ya no podrá iniciar sesión.`, {
      peligro: true,
      textoConfirmar: 'Desactivar',
    })
    if (confirmado) mutacionEstado.mutate({ id: u.id, activo: false })
  }

  async function handleResetearPassword(u: Usuario) {
    const confirmado = await confirmar(`¿Generar una nueva contraseña provisional para "${u.nombre}"?`, {
      textoConfirmar: 'Generar',
    })
    if (!confirmado) return
    setErrorGeneral('')
    try {
      const { passwordProvisional } = await mutacionReset.mutateAsync(u.id)
      setPasswordReseteada({ nombre: u.nombre, password: passwordProvisional })
    } catch {
      // el error ya se muestra vía onError
    }
  }

  return (
    <div className="gg-usuarios-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-usuarios-main">
        <div className="gg-usuarios-toolbar">
          <h1 className="font-display gg-usuarios-title">Usuarios</h1>
          <Button type="button" onClick={abrirNuevo}>
            <Plus size={18} />
            Nuevo usuario
          </Button>
        </div>
        <p className="gg-usuarios-subtitulo">
          Crea una cuenta para cada persona del equipo, con el rol que le corresponde. Así cada quien
          entra con su propio usuario y queda registro de quién hizo cada venta o apertura de caja.
        </p>

        {isLoading && (
          <Card className="gg-usuarios-estado">
            <p>Cargando usuarios…</p>
          </Card>
        )}
        {isError && (
          <Card className="gg-usuarios-estado">
            <p>No pudimos cargar los usuarios.</p>
          </Card>
        )}
        {errorGeneral && <p className="gg-field-error">{errorGeneral}</p>}

        {!isLoading && !isError && usuarios && (
          <div className="gg-usuarios-lista">
            {usuarios.map((u) => {
              const esUsuarioActual = u.id === usuarioActual?.id
              return (
                <Card key={u.id} className={'gg-usuario-card' + (!u.activo ? ' gg-usuario-card--inactivo' : '')}>
                  <div className="gg-usuario-info">
                    <p className="gg-usuario-nombre">
                      {u.nombre}
                      <span className={'gg-usuario-chip' + (!u.activo ? ' gg-usuario-chip--inactivo' : '')}>
                        {ROL_LABEL[u.rol]}
                      </span>
                      {!u.activo && <span className="gg-usuario-chip gg-usuario-chip--inactivo">Inactivo</span>}
                    </p>
                    <p className="gg-usuario-email">{u.email}</p>
                  </div>
                  <div className="gg-usuario-acciones">
                    <button
                      type="button"
                      className="gg-usuario-accion"
                      title="Editar nombre y rol"
                      onClick={() => abrirEditar(u)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="gg-usuario-accion"
                      title="Generar nueva contraseña provisional"
                      disabled={mutacionReset.isPending}
                      onClick={() => handleResetearPassword(u)}
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      type="button"
                      className="gg-usuario-accion"
                      title={
                        esUsuarioActual
                          ? 'No puedes desactivar tu propia cuenta'
                          : u.activo
                            ? 'Desactivar'
                            : 'Reactivar'
                      }
                      disabled={esUsuarioActual || mutacionEstado.isPending}
                      onClick={() =>
                        u.activo ? handleDesactivar(u) : mutacionEstado.mutate({ id: u.id, activo: true })
                      }
                    >
                      <Power size={15} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {modalAbierto && (
        <UsuarioFormModal usuario={usuarioEditando} onClose={() => setModalAbierto(false)} />
      )}

      {passwordReseteada && (
        <RevelarPasswordModal
          nombre={passwordReseteada.nombre}
          password={passwordReseteada.password}
          onClose={() => setPasswordReseteada(null)}
        />
      )}
    </div>
  )
}
