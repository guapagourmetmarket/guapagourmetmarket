import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import type { Producto } from '@guapa/shared'

export interface LineaCarrito {
  producto: Producto
  cantidad: number
}

interface CarritoContextValue {
  lineas: LineaCarrito[]
  agregarProducto: (producto: Producto) => void
  cambiarCantidad: (productoId: string, delta: number) => void
  establecerCantidad: (productoId: string, cantidad: number) => void
  quitarLinea: (productoId: string) => void
  vaciar: () => void
  total: number
}

const CarritoContext = createContext<CarritoContextValue | null>(null)

export function CarritoProvider({ children }: PropsWithChildren) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([])

  function agregarProducto(producto: Producto) {
    setLineas((prev) => {
      const existente = prev.find((l) => l.producto.id === producto.id)
      if (existente) {
        return prev.map((l) =>
          l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l,
        )
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

  // Para productos que se venden por peso: el cajero escribe el peso exacto
  // (ej. 0.350 kg) en vez de sumar de a una unidad.
  function establecerCantidad(productoId: string, cantidad: number) {
    setLineas((prev) =>
      prev
        .map((l) => (l.producto.id === productoId ? { ...l, cantidad } : l))
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
    () => lineas.reduce((acc, l) => acc + l.producto.precioVenta * l.cantidad, 0),
    [lineas],
  )

  return (
    <CarritoContext.Provider
      value={{ lineas, agregarProducto, cambiarCantidad, establecerCantidad, quitarLinea, vaciar, total }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return ctx
}
