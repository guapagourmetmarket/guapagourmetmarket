import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Menu, Phone, UserCircle, X } from 'lucide-react'
import { Button } from './Button'
import { MiCuentaModal } from './MiCuentaModal'
import { EstadoConexion } from './EstadoConexion'
import { InstagramIcon, TikTokIcon } from './SocialIcons'
import { brand } from '../theme/theme'
import { obtenerAlertas, obtenerUsuarioSesion, type Rol } from '../lib/api'
import './app-header.css'

interface AppHeaderProps {
  onCerrarSesion: () => void
}

const GERENCIAL: Rol[] = ['administrador', 'contador', 'supervisor']

// Sin "roles" = visible para cualquiera con sesión (incluido cajero). El
// backend ya rechaza estas rutas para quien no tenga el rol permitido; esto
// solo evita ofrecerle a un cajero un enlace que le va a dar error 403.
const ENLACES: { to: string; label: string; roles?: Rol[] }[] = [
  { to: '/productos', label: 'Productos' },
  { to: '/caja', label: 'Caja' },
  { to: '/pos-tactil', label: 'Táctil' },
  { to: '/ventas', label: 'Venta manual' },
  { to: '/compras', label: 'Compras', roles: GERENCIAL },
  { to: '/proveedores', label: 'Proveedores', roles: GERENCIAL },
  { to: '/clientes', label: 'Clientes' },
  { to: '/alertas', label: 'Alertas' },
  { to: '/contabilidad', label: 'Contabilidad', roles: GERENCIAL },
  { to: '/reportes', label: 'Reportes', roles: GERENCIAL },
  { to: '/negocio', label: 'Negocio', roles: ['administrador'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['administrador'] },
]

function claseLink({ isActive }: { isActive: boolean }) {
  return 'gg-header-link' + (isActive ? ' gg-header-link--active' : '')
}

export function AppHeader({ onCerrarSesion }: AppHeaderProps) {
  const [miCuentaAbierta, setMiCuentaAbierta] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rolActual = obtenerUsuarioSesion()?.rol as Rol | undefined
  const enlacesVisibles = ENLACES.filter(
    (enlace) => !enlace.roles || (rolActual && enlace.roles.includes(rolActual)),
  )

  // Puntico animado en "Alertas" cuando hay algo por vencer o con poco
  // stock: llama la atención sin que haga falta entrar a revisar.
  const { data: alertas } = useQuery({
    queryKey: ['alertas-resumen'],
    queryFn: obtenerAlertas,
    staleTime: 60_000,
  })
  const totalAlertas = (alertas?.stockBajo.length ?? 0) + (alertas?.porVencer.length ?? 0)

  return (
    <header className="gg-header">
      <EstadoConexion />
      <div className="gg-header-marca">
        <div className="gg-header-marca-fila">
          <img src={brand.logo.hi} alt={brand.name} width={96} height={96} />
          <span className="font-display gg-header-marca-nombre">{brand.name}</span>
        </div>
        <span className="gg-header-marca-autora">by {brand.creator}</span>

        <div className="gg-header-contacto">
          <span className="gg-header-contacto-direccion">{brand.contacto.direccion}</span>
          <a className="gg-header-contacto-item" href={brand.contacto.telefonoHref}>
            <span className="gg-header-insignia gg-header-insignia--tel">
              <Phone size={10} />
            </span>
            {brand.contacto.telefono}
          </a>
          <a
            className="gg-header-contacto-item"
            href={brand.contacto.instagramHref}
            target="_blank"
            rel="noreferrer"
          >
            <span className="gg-header-insignia gg-header-insignia--ig">
              <InstagramIcon size={10} />
            </span>
            {brand.contacto.instagram}
          </a>
          <a className="gg-header-contacto-item" href={brand.contacto.tiktokHref} target="_blank" rel="noreferrer">
            <span className="gg-header-insignia gg-header-insignia--tt">
              <TikTokIcon size={10} />
            </span>
            {brand.contacto.tiktok}
          </a>
        </div>
      </div>

      <div className="gg-header-fila-nav">
        <nav className="gg-header-nav">
          {enlacesVisibles.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} className={claseLink}>
              {enlace.label}
              {enlace.to === '/alertas' && totalAlertas > 0 && (
                <span className="gg-header-alerta-punto" aria-label={`${totalAlertas} alertas activas`} />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="gg-header-acciones">
          <Button variant="ghost" onClick={() => setMiCuentaAbierta(true)}>
            <UserCircle size={18} />
            Mi cuenta
          </Button>
          <Button variant="ghost" onClick={onCerrarSesion}>
            <LogOut size={18} />
            Cerrar sesión
          </Button>
        </div>

        <button
          type="button"
          className="gg-header-menu-boton"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuAbierto && (
        <>
          <button
            type="button"
            className="gg-header-menu-fondo"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          />
          <nav className="gg-header-menu-movil">
            {enlacesVisibles.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                className={claseLink}
                onClick={() => setMenuAbierto(false)}
              >
                {enlace.label}
                {enlace.to === '/alertas' && totalAlertas > 0 && (
                  <span className="gg-header-alerta-punto" aria-label={`${totalAlertas} alertas activas`} />
                )}
              </NavLink>
            ))}
            <div className="gg-header-menu-movil-separador" />
            <button
              type="button"
              className="gg-header-link"
              onClick={() => {
                setMenuAbierto(false)
                setMiCuentaAbierta(true)
              }}
            >
              <UserCircle size={18} />
              Mi cuenta
            </button>
            <button
              type="button"
              className="gg-header-link"
              onClick={() => {
                setMenuAbierto(false)
                onCerrarSesion()
              }}
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </nav>
        </>
      )}

      {miCuentaAbierta && <MiCuentaModal onClose={() => setMiCuentaAbierta(false)} />}
    </header>
  )
}
