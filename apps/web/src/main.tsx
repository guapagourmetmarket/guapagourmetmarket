import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import { applyBrand } from './theme/theme'
import { CarritoProvider } from './lib/carrito'
import { ConfirmProvider } from './lib/confirm'
import { ThemeModeProvider, leerModoGuardado } from './lib/themeMode'
import { iniciarSincronizacionAutomatica } from './lib/sync'
import { notificarActualizacionDisponible } from './lib/swUpdate'
import { ActualizacionBanner } from './components/ActualizacionBanner'
import './index.css'
import App from './App.tsx'

// Se aplica de una vez (antes de montar React) para que no se vea un
// parpadeo del tema claro antes de que ThemeModeProvider tome control.
applyBrand(undefined, leerModoGuardado())
iniciarSincronizacionAutomatica()

// Antes esto recargaba la página sola apenas había una versión nueva
// publicada — con varios cambios seguidos en el mismo rato, la pantalla
// se reiniciaba de golpe mientras se estaba usando, y se sentía como
// "saltos" random. Ahora solo avisa (ActualizacionBanner) y la persona
// decide cuándo actualizar.
const actualizarSW = registerSW({
  onNeedRefresh() {
    notificarActualizacionDisponible(() => actualizarSW(true))
  },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <ConfirmProvider>
          <CarritoProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
            <ActualizacionBanner />
          </CarritoProvider>
        </ConfirmProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
