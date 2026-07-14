import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { applyBrand } from './theme/theme'
import { CarritoProvider } from './lib/carrito'
import { iniciarSincronizacionAutomatica } from './lib/sync'
import './index.css'
import App from './App.tsx'

applyBrand()
iniciarSincronizacionAutomatica()

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
