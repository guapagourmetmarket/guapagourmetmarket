// Puente simple entre main.tsx (fuera del árbol de React, donde se registra
// el service worker) y el banner de React que avisa de la actualización.
// Antes la página se recargaba sola apenas había una versión nueva — eso se
// sentía como "saltos" random mientras se estaba usando el sistema. Ahora
// solo avisa; la persona decide cuándo actualizar.
type AplicarActualizacion = () => void

let actualizacionPendiente: AplicarActualizacion | null = null

export function notificarActualizacionDisponible(aplicar: AplicarActualizacion) {
  actualizacionPendiente = aplicar
  window.dispatchEvent(new CustomEvent('gg-actualizacion-disponible'))
}

export function suscribirseActualizacion(cb: (aplicar: AplicarActualizacion) => void) {
  const handler = () => {
    if (actualizacionPendiente) cb(actualizacionPendiente)
  }
  window.addEventListener('gg-actualizacion-disponible', handler)
  return () => window.removeEventListener('gg-actualizacion-disponible', handler)
}
