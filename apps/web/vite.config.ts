import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Escucha en todas las interfaces de red, no solo localhost, para poder
    // entrar desde el celular u otro computador en la misma red WiFi.
    host: true,
  },
})
