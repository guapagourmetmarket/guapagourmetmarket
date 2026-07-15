import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import { applyBrand } from './theme/theme'
import { CarritoProvider } from './lib/carrito'
import { iniciarSincronizacionAutomatica } from './lib/sync'
import './index.css'
import App from './App.tsx'

applyBrand()
iniciarSincronizacionAutomatica()

// El service worker ya se actualiza solo (skipWaiting + clientsClaim en
// vite.config.ts); esto recarga la página una sola vez cuando eso pasa, para
// que la pantalla abierta muestre el código nuevo en vez de quedarse con el
// viejo hasta que alguien cierre y vuelva a abrir la app.
registerSW({ immediate: true })
if ('serviceWorker' in navigator) {
  let recargando = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return
    recargando = true
    window.location.reload()
  })
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CarritoProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CarritoProvider>
    </QueryClientProvider>
  </StrictMode>,
)
