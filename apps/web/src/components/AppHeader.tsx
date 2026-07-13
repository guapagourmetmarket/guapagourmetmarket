import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, UserCircle } from 'lucide-react'
import { Button } from './Button'
import { MiCuentaModal } from './MiCuentaModal'
import { brand } from '../theme/theme'
import './app-header.css'

interface AppHeaderProps {
  onCerrarSesion: () => void
}

function claseLink({ isActive }: { isActive: boolean }) {
  return 'gg-header-link' + (isActive ? ' gg-header-link--active' : '')
}

export function AppHeader({ onCerrarSesion }: AppHeaderProps) {
  const [miCuentaAbierta, setMiCuentaAbierta] = useState(false)

  return (
    <header className="gg-header">
      <div className="gg-header-brand">
        <img src={brand.logo.full} alt={brand.name} width={40} height={40} />
        <span className="font-display gg-header-brand-name">{brand.name}</span>
      </div>
      <nav className="gg-header-nav">
        <NavLink to="/productos" className={claseLink}>
          Productos
        </NavLink>
        <NavLink to="/ventas" className={claseLink}>
          Venta manual
        </NavLink>
        <NavLink to="/compras" className={claseLink}>
          Compras
        </NavLink>
        <NavLink to="/proveedores" className={claseLink}>
          Proveedores
        </NavLink>
        <NavLink to="/clientes" className={claseLink}>
          Clientes
        </NavLink>
        <NavLink to="/alertas" className={claseLink}>
          Alertas
        </NavLink>
        <NavLink to="/contabilidad" className={claseLink}>
          Contabilidad
        </NavLink>
        <NavLink to="/reportes" className={claseLink}>
          Reportes
        </NavLink>
        <NavLink to="/negocio" className={claseLink}>
          Negocio
        </NavLink>
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

      {miCuentaAbierta && <MiCuentaModal onClose={() => setMiCuentaAbierta(false)} />}
    </header>
  )
}
