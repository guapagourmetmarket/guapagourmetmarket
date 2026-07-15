import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // El manifest.webmanifest ya existe en public/ con la marca (nombre,
      // colores, íconos); solo se agrega el service worker que cachea la
      // app para que abra sin internet.
      manifest: false,
      registerType: 'autoUpdate',
      workbox: {
        // La API vive en otro dominio (Render), así que este precache solo
        // cubre el "cascarón" de la app (JS/CSS/fuentes/íconos); los datos
        // offline (productos, ventas) los maneja lib/db.ts y lib/sync.ts.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        // Sin esto, un service worker viejo se queda sirviendo la versión
        // anterior de la app hasta que se cierren todas las pestañas: con
        // skipWaiting + clientsClaim, el nuevo toma control de inmediato y
        // main.tsx fuerza un recargo una sola vez para mostrarlo.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  server: {
    // Escucha en todas las interfaces de red, no solo localhost, para poder
    // entrar desde el celular u otro computador en la misma red WiFi.
    host: true,
  },
})
