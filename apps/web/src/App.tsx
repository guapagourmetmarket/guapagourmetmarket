import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginScreen } from './features/auth/LoginScreen'
import { ProductosScreen } from './features/productos/ProductosScreen'
import { ProductoFormScreen } from './features/productos/ProductoFormScreen'
import { VentaManualScreen } from './features/ventas/VentaManualScreen'
import { NegocioScreen } from './features/negocio/NegocioScreen'
import { ProveedoresScreen } from './features/proveedores/ProveedoresScreen'
import { ComprasScreen } from './features/compras/ComprasScreen'
import { AlertasScreen } from './features/alertas/AlertasScreen'
import { ContabilidadScreen } from './features/contabilidad/ContabilidadScreen'
import { GastosScreen } from './features/contabilidad/GastosScreen'
import { ClientesScreen } from './features/clientes/ClientesScreen'
import { obtenerPerfil, obtenerTokenGuardado, setAuthToken, type LoginResponse } from './lib/api'

// Recharts es pesado (~400KB); se carga solo al entrar a /reportes.
const ReportesScreen = lazy(() =>
  import('./features/reportes/ReportesScreen').then((m) => ({ default: m.ReportesScreen })),
)

function App() {
  const [sesion, setSesionState] = useState<LoginResponse | null>(null)
  const [validandoSesion, setValidandoSesion] = useState(true)
  const autenticado = sesion !== null

  useEffect(() => {
    const token = obtenerTokenGuardado()
    if (!token) {
      setValidandoSesion(false)
      return
    }
    // Al refrescar la página no se pierde la sesión: se retoma el token
    // guardado y se confirma contra la API antes de mostrar la app.
    setAuthToken(token)
    obtenerPerfil()
      .then((usuario) => setSesionState({ accessToken: token, usuario }))
      .catch(() => setAuthToken(null))
      .finally(() => setValidandoSesion(false))
  }, [])

  function iniciarSesion(nuevaSesion: LoginResponse) {
    setAuthToken(nuevaSesion.accessToken)
    setSesionState(nuevaSesion)
  }

  function cerrarSesion() {
    setAuthToken(null)
    setSesionState(null)
  }

  if (validandoSesion) return null

  return (
    <Routes>
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
      <Route path="*" element={<Navigate to={autenticado ? '/productos' : '/login'} replace />} />
    </Routes>
  )
}

export default App
