import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginScreen } from './features/auth/LoginScreen'
import { ProductosScreen } from './features/productos/ProductosScreen'
import { ProductoFormScreen } from './features/productos/ProductoFormScreen'
import { VentaManualScreen } from './features/ventas/VentaManualScreen'
import { NegocioScreen } from './features/negocio/NegocioScreen'
import { UsuariosScreen } from './features/usuarios/UsuariosScreen'
import { ProveedoresScreen } from './features/proveedores/ProveedoresScreen'
import { ComprasScreen } from './features/compras/ComprasScreen'
import { AlertasScreen } from './features/alertas/AlertasScreen'
import { ContabilidadScreen } from './features/contabilidad/ContabilidadScreen'
import { GastosScreen } from './features/contabilidad/GastosScreen'
import { CuponesScreen } from './features/cupones/CuponesScreen'
import { PedidosScreen } from './features/pedidos/PedidosScreen'
import { CuentasScreen } from './features/cuentas/CuentasScreen'
import { AuditoriaScreen } from './features/auditoria/AuditoriaScreen'
import { DesignSystemScreen } from './features/design-system/DesignSystemScreen'
import { ClientesScreen } from './features/clientes/ClientesScreen'
import { EnlacesScreen } from './features/enlaces/EnlacesScreen'
import { TiendaScreen } from './features/tienda/TiendaScreen'
import { CajaScreen } from './features/caja/CajaScreen'
import { PosTactilScreen } from './features/pos-tactil/PosTactilScreen'
import {
  guardarUsuarioSesion,
  obtenerSesionGuardada,
  setAuthToken,
  type LoginResponse,
} from './lib/api'

// Recharts es pesado (~400KB); se carga solo al entrar a /reportes.
const ReportesScreen = lazy(() =>
  import('./features/reportes/ReportesScreen').then((m) => ({ default: m.ReportesScreen })),
)

function App() {
  // La sesión se retoma directo de localStorage, sin esperar respuesta del
  // servidor: en el plan gratis de Render la API se "duerme" y esa espera
  // sacaba a la usuaria de la sesión sin necesidad con cada refresco.
  const [sesion, setSesionState] = useState<LoginResponse | null>(() => {
    const guardada = obtenerSesionGuardada()
    if (guardada) setAuthToken(guardada.accessToken)
    return guardada
  })
  const autenticado = sesion !== null

  function iniciarSesion(nuevaSesion: LoginResponse) {
    setAuthToken(nuevaSesion.accessToken)
    guardarUsuarioSesion(nuevaSesion.usuario)
    setSesionState(nuevaSesion)
  }

  function cerrarSesion() {
    setAuthToken(null)
    setSesionState(null)
  }

  return (
    <Routes>
      <Route path="/enlaces" element={<EnlacesScreen />} />
      <Route path="/tienda" element={<TiendaScreen />} />
      <Route
        path="/login"
        element={
          autenticado ? (
            <Navigate to="/productos" replace />
          ) : (
            <LoginScreen onIniciarSesion={iniciarSesion} />
          )
        }
      />
      <Route
        path="/productos"
        element={
          autenticado ? (
            <ProductosScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/productos/nuevo"
        element={
          autenticado ? (
            <ProductoFormScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/productos/:id/editar"
        element={
          autenticado ? (
            <ProductoFormScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/caja"
        element={
          autenticado ? <CajaScreen onCerrarSesion={cerrarSesion} /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/pos-tactil"
        element={
          autenticado ? (
            <PosTactilScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/ventas"
        element={
          autenticado ? (
            <VentaManualScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/proveedores"
        element={
          autenticado ? (
            <ProveedoresScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/compras"
        element={
          autenticado ? (
            <ComprasScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/alertas"
        element={
          autenticado ? (
            <AlertasScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/contabilidad"
        element={
          autenticado ? (
            <ContabilidadScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/gastos"
        element={
          autenticado ? (
            <GastosScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/cupones"
        element={
          autenticado ? (
            <CuponesScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/pedidos"
        element={
          autenticado ? (
            <PedidosScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/cuentas"
        element={
          autenticado ? (
            <CuentasScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/clientes"
        element={
          autenticado ? (
            <ClientesScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/reportes"
        element={
          autenticado ? (
            <Suspense fallback={null}>
              <ReportesScreen onCerrarSesion={cerrarSesion} />
            </Suspense>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/negocio"
        element={
          autenticado ? (
            <NegocioScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/usuarios"
        element={
          autenticado ? (
            <UsuariosScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/auditoria"
        element={
          autenticado ? (
            <AuditoriaScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/design-system"
        element={
          autenticado ? (
            <DesignSystemScreen onCerrarSesion={cerrarSesion} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={autenticado ? '/productos' : '/login'} replace />} />
    </Routes>
  )
}

export default App
