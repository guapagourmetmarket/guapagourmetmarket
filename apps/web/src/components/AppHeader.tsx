import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, Menu, UserCircle, X } from 'lucide-react'
import { Button } from './Button'
import { MiCuentaModal } from './MiCuentaModal'
import { brand } from '../theme/theme'
import './app-header.css'

interface AppHeaderProps {
  onCerrarSesion: () => void
}

const ENLACES = [
  { to: '/productos', label: 'Productos' },
  { to: '/ventas', label: 'Venta manual' },
  { to: '/compras', label: 'Compras' },
  { to: '/proveedores', label: 'Proveedores' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/alertas', label: 'Alertas' },
  { to: '/contabilidad', label: 'Contabilidad' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/negocio', label: 'Negocio' },
]

function claseLink({ isActive }: { isActive: boolean }) {
  return 'gg-header-link' + (isActive ? ' gg-header-link--active' : '')
}

export function AppHeader({ onCerrarSesion }: AppHeaderProps) {
  const [miCuentaAbierta, setMiCuentaAbierta] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <header className="gg-header">
      <div className="gg-header-marca">
        <div className="gg-header-marca-fila">
          <img src={brand.logo.full} alt={brand.name} width={40} height={40} />
          <span className="font-display gg-header-marca-nombre">{brand.name}</span>
        </div>
        <span className="gg-header-marca-autora">by {brand.creator}</span>
      </div>

      <div className="gg-header-fila-nav">
        <nav className="gg-header-nav">
          {ENLACES.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} className={claseLink}>
              {enlace.label}
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
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                className={claseLink}
                onClick={() => setMenuAbierto(false)}
              >
                {enlace.label}
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
