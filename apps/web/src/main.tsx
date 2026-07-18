import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import { applyBrand } from './theme/theme'
import { CarritoProvider } from './lib/carrito'
import { CarritoPublicoProvider } from './lib/carritoPublico'
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
//
// El navegador solo revisa si hay una versión nueva del service worker en
// momentos puntuales (ej. al cargar la página) y a veces lo posterga horas
// si la pestaña se queda abierta todo el día (como pasa usando esto de
// caja). Por eso se fuerza la revisión cada minuto y cada vez que se
// vuelve a esta pestaña, para que el aviso de actualización aparezca
// rápido después de publicar un cambio, en vez de quedarse pegado en una
// versión vieja sin que se note.
const actualizarSW = registerSW({
  onNeedRefresh() {
    notificarActualizacionDisponible(() => actualizarSW(true))
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    setInterval(() => registration.update(), 60_000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <ConfirmProvider>
          <CarritoProvider>
            <CarritoPublicoProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
              <ActualizacionBanner />
            </CarritoPublicoProvider>
          </CarritoProvider>
        </ConfirmProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
