import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Menu, Phone, UserCircle, X } from 'lucide-react'
import { Button } from './Button'
import { MiCuentaModal } from './MiCuentaModal'
import { EstadoConexion } from './EstadoConexion'
import { InstagramIcon, TikTokIcon } from './SocialIcons'
import { Marquee } from './Marquee'
import { brand } from '../theme/theme'
import {
  obtenerAlertas,
  obtenerCartera,
  obtenerCarteraClientes,
  obtenerCumpleanosDelMes,
  obtenerPedidos,
  obtenerPedidosWeb,
  obtenerUsuarioSesion,
  type Rol,
} from '../lib/api'
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
  { to: '/cuentas', label: 'Cuentas' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/pedidos-web', label: 'Pedidos web' },
  { to: '/compras', label: 'Compras', roles: GERENCIAL },
  { to: '/proveedores', label: 'Proveedores', roles: GERENCIAL },
  { to: '/cupones', label: 'Cupones', roles: GERENCIAL },
  { to: '/clientes', label: 'Clientes' },
  { to: '/alertas', label: 'Alertas' },
  { to: '/contabilidad', label: 'Contabilidad', roles: GERENCIAL },
  { to: '/reportes', label: 'Reportes', roles: GERENCIAL },
  { to: '/negocio', label: 'Negocio', roles: ['administrador'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['administrador'] },
  { to: '/auditoria', label: 'Auditoría', roles: ['administrador'] },
  { to: '/design-system', label: 'Design System', roles: ['administrador'] },
]

function claseLink({ isActive }: { isActive: boolean }) {
  return 'gg-header-link' + (isActive ? ' gg-header-link--active' : '')
}

export function AppHeader({ onCerrarSesion }: AppHeaderProps) {
  const [miCuentaAbierta, setMiCuentaAbierta] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rolActual = obtenerUsuarioSesion()?.rol as Rol | undefined
  const esGerencial = rolActual ? GERENCIAL.includes(rolActual) : false
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

  const hoy = new Date().toISOString().slice(0, 10)

  // Mismo patrón para "Clientes": fiado con fecha de pago vencida. Este
  // endpoint es abierto para cualquier rol con sesión, así que no hay que
  // condicionar la consulta.
  const { data: carteraClientes } = useQuery({
    queryKey: ['cartera-clientes-resumen'],
    queryFn: obtenerCarteraClientes,
    staleTime: 60_000,
  })
  const clientesVencidos = (carteraClientes ?? []).filter(
    (v) => v.fechaVencimientoPago && v.fechaVencimientoPago < hoy,
  ).length

  // "Contabilidad" (cuentas por pagar a proveedores): el endpoint es
  // gerencial, así que la consulta solo se dispara para esos roles.
  const { data: carteraProveedores } = useQuery({
    queryKey: ['cartera-proveedores-resumen'],
    queryFn: obtenerCartera,
    staleTime: 60_000,
    enabled: esGerencial,
  })
  const proveedoresVencidos = (carteraProveedores ?? []).filter(
    (c) => c.fechaVencimientoPago && c.fechaVencimientoPago < hoy,
  ).length

  // Cumpleaños: "hoy" es lo que realmente amerita una alerta; "este mes"
  // es el respaldo si hoy no hay ninguno, para que la torta no desaparezca
  // apenas pasa el día exacto.
  const { data: cumpleanosMes } = useQuery({
    queryKey: ['cumpleanos-resumen'],
    queryFn: obtenerCumpleanosDelMes,
    staleTime: 60_000,
  })
  const hoyDia = new Date().getDate()
  const cumpleanosHoy = (cumpleanosMes ?? []).filter(
    (c) => c.fechaNacimiento && Number(c.fechaNacimiento.split('-')[2]) === hoyDia,
  )

  // "Pedidos" (encargos especiales, ej. tortas): se avisa cuando la fecha
  // de entrega está a 2 días o menos, para no dejarlo pasar.
  const { data: pedidos } = useQuery({
    queryKey: ['pedidos-resumen'],
    queryFn: obtenerPedidos,
    staleTime: 60_000,
  })
  const limitePedidos = new Date()
  limitePedidos.setDate(limitePedidos.getDate() + 2)
  const limitePedidosStr = limitePedidos.toISOString().slice(0, 10)
  const pedidosProximos = (pedidos ?? []).filter(
    (p) => p.estado === 'pendiente' && p.fechaEntrega <= limitePedidosStr,
  )

  // "Pedidos web" (pre-pedidos desde la tienda pública): se avisa mientras
  // sigan en "pendiente" sin revisar, sin importar cuándo llegaron.
  const { data: pedidosWeb } = useQuery({
    queryKey: ['pedidos-web-resumen'],
    queryFn: obtenerPedidosWeb,
    staleTime: 60_000,
  })
  const pedidosWebPendientes = (pedidosWeb ?? []).filter((p) => p.estado === 'pendiente')

  const mensajesInternos = [
    `🏪 ${brand.name} · ${brand.contacto.direccion}`,
    pedidosProximos.length > 0
      ? `📦 ${pedidosProximos.length} pedido${pedidosProximos.length === 1 ? '' : 's'} por encargo próximo${pedidosProximos.length === 1 ? '' : 's'} a entregar`
      : null,
    pedidosWebPendientes.length > 0
      ? `🛒 ${pedidosWebPendientes.length} pedido${pedidosWebPendientes.length === 1 ? '' : 's'} nuevo${pedidosWebPendientes.length === 1 ? '' : 's'} desde la tienda web`
      : null,
    cumpleanosHoy.length > 0
      ? `🎂 ¡Hoy cumple años ${cumpleanosHoy.map((c) => c.nombre).join(', ')}!`
      : cumpleanosMes && cumpleanosMes.length > 0
        ? `🎂 ${cumpleanosMes.length} cliente${cumpleanosMes.length === 1 ? '' : 's'} de cumpleaños este mes`
        : null,
    totalAlertas > 0
      ? `⚠️ ${totalAlertas} alerta${totalAlertas === 1 ? '' : 's'} de inventario (stock bajo o por vencer)`
      : null,
    clientesVencidos > 0
      ? `💳 ${clientesVencidos} cliente${clientesVencidos === 1 ? '' : 's'} con pago vencido`
      : null,
    esGerencial && proveedoresVencidos > 0
      ? `🧾 ${proveedoresVencidos} cuenta${proveedoresVencidos === 1 ? '' : 's'} por pagar vencida${proveedoresVencidos === 1 ? '' : 's'}`
      : null,
    '🌿 Tu nuevo hábito saludable',
  ].filter((m): m is string => Boolean(m))

  return (
    <header className="gg-header">
      <EstadoConexion />
      <Marquee items={mensajesInternos} className="gg-marquee--interna" />
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
              {enlace.to === '/clientes' && clientesVencidos > 0 && (
                <span
                  className="gg-header-alerta-punto gg-header-alerta-punto--clientes"
                  aria-label={`${clientesVencidos} clientes con pago vencido`}
                />
              )}
              {enlace.to === '/clientes' && cumpleanosHoy.length > 0 && (
                <span
                  className="gg-header-cumpleanos-badge"
                  aria-label={`Hoy cumple años: ${cumpleanosHoy.map((c) => c.nombre).join(', ')}`}
                >
                  🎂
                </span>
              )}
              {enlace.to === '/contabilidad' && esGerencial && proveedoresVencidos > 0 && (
                <span
                  className="gg-header-alerta-punto gg-header-alerta-punto--clientes"
                  aria-label={`${proveedoresVencidos} cuentas por pagar vencidas`}
                />
              )}
              {enlace.to === '/pedidos' && pedidosProximos.length > 0 && (
                <span
                  className="gg-header-alerta-punto gg-header-alerta-punto--clientes"
                  aria-label={`${pedidosProximos.length} pedidos por encargo próximos`}
                />
              )}
              {enlace.to === '/pedidos-web' && pedidosWebPendientes.length > 0 && (
                <span
                  className="gg-header-alerta-punto gg-header-alerta-punto--clientes"
                  aria-label={`${pedidosWebPendientes.length} pedidos web pendientes`}
                />
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
