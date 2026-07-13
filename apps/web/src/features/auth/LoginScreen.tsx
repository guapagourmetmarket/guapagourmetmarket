import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { brand } from '../../theme/theme'
import { ApiError, login, type LoginResponse } from '../../lib/api'
import './auth.css'

interface LoginScreenProps {
  onIniciarSesion: (sesion: LoginResponse) => void
}

export function LoginScreen({ onIniciarSesion }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !clave.trim()) {
      setError('Ingresa tu correo y tu contraseña.')
      return
    }

    setCargando(true)
    try {
      const sesion = await login(email.trim(), clave)
      onIniciarSesion(sesion)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos conectar con el servidor. Verifica que la API esté encendida.',
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="gg-login-page">
      <Card className="gg-login-card">
        <div className="gg-login-brand">
          <img
            src={brand.logo.hi}
            alt={brand.name}
            width={88}
            height={88}
            className="gg-login-logo"
          />
          <h1 className="font-display gg-login-title">{brand.name}</h1>
          <p className="gg-login-author">by {brand.creator}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="gg-login-fields">
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="••••••••"
              error={error || undefined}
            />
          </div>

          <Button type="submit" size="lg" disabled={cargando} className="gg-login-submit">
            {cargando ? (
              <>
                <Loader2 size={18} className="gg-spin" />
                Ingresando…
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
}
