import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { suscribirseActualizacion } from '../lib/swUpdate'
import { useCarrito } from '../lib/carrito'
import { useCarritoPublico } from '../lib/carritoPublico'
import './actualizacion-banner.css'

/**
 * Avisa cuando hay una versión nueva publicada. Si no hay nada a mitad de
 * una venta (los dos carritos vacíos), se aplica sola — así cada equipo
 * (Windows, iPad, celular, el que sea) queda al día sin que alguien tenga
 * que acordarse de darle a un botón. Si sí hay algo en curso, solo avisa
 * y espera a que la persona decida, para no interrumpir una venta.
 */
export function ActualizacionBanner() {
  const [aplicar, setAplicar] = useState<(() => void) | null>(null)
  const carrito = useCarrito()
  const carritoPublico = useCarritoPublico()
  const carritosVacios = carrito.lineas.length === 0 && carritoPublico.lineas.length === 0
  // Refs para leer el valor más reciente dentro del callback del service
  // worker, sin tener que reinscribirse cada vez que cambia el carrito.
  const carritosVaciosRef = useRef(carritosVacios)
  carritosVaciosRef.current = carritosVacios

  useEffect(
    () =>
      suscribirseActualizacion((cb) => {
        if (carritosVaciosRef.current) {
          cb()
        } else {
          setAplicar(() => cb)
        }
      }),
    [],
  )

  // Si el aviso ya estaba esperando (había una venta en curso) y el
  // carrito se acaba de vaciar, se aplica sola en vez de dejar el
  // letrero pegado hasta que alguien lo note.
  useEffect(() => {
    if (aplicar && carritosVacios) aplicar()
  }, [aplicar, carritosVacios])

  if (!aplicar) return null

  return (
    <div className="gg-actualizacion-banner">
      <RefreshCw size={16} />
      <span>Hay una versión nueva del sistema.</span>
      <button type="button" onClick={aplicar}>
        Actualizar ahora
      </button>
    </div>
  )
}
