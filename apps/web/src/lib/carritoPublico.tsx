import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import type { ProductoPublico } from './api'
import { precioEfectivo } from './precio'

// Carrito aparte del interno (lib/carrito.tsx): la tienda pública solo
// conoce `ProductoPublico` (sin costo, existencias exactas, etc.), así
// que no tiene sentido compartir el mismo tipo ni el mismo estado que
// usa la caja/POS.
export interface LineaCarritoPublico {
  producto: ProductoPublico
  cantidad: number
}

interface CarritoPublicoContextValue {
  lineas: LineaCarritoPublico[]
  agregarProducto: (producto: ProductoPublico) => void
  cambiarCantidad: (productoId: string, delta: number) => void
  quitarLinea: (productoId: string) => void
  vaciar: () => void
  total: number
  totalUnidades: number
}

const CarritoPublicoContext = createContext<CarritoPublicoContextValue | null>(null)

export function CarritoPublicoProvider({ children }: PropsWithChildren) {
  const [lineas, setLineas] = useState<LineaCarritoPublico[]>([])

  function agregarProducto(producto: ProductoPublico) {
    setLineas((prev) => {
      const existente = prev.find((l) => l.producto.id === producto.id)
      if (existente) {
        return prev.map((l) => (l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l))
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  function cambiarCantidad(productoId: string, delta: number) {
    setLineas((prev) =>
      prev
        .map((l) => (l.producto.id === productoId ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0),
    )
  }

  function quitarLinea(productoId: string) {
    setLineas((prev) => prev.filter((l) => l.producto.id !== productoId))
  }

  function vaciar() {
    setLineas([])
  }

  const total = useMemo(
    () => lineas.reduce((acc, l) => acc + precioEfectivo(l.producto) * l.cantidad, 0),
    [lineas],
  )
  const totalUnidades = useMemo(() => lineas.reduce((acc, l) => acc + l.cantidad, 0), [lineas])

  return (
    <CarritoPublicoContext.Provider
      value={{ lineas, agregarProducto, cambiarCantidad, quitarLinea, vaciar, total, totalUnidades }}
    >
      {children}
    </CarritoPublicoContext.Provider>
  )
}

export function useCarritoPublico() {
  const ctx = useContext(CarritoPublicoContext)
  if (!ctx) throw new Error('useCarritoPublico debe usarse dentro de <CarritoPublicoProvider>')
  return ctx
}
