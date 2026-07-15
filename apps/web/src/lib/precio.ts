import type { Producto } from '@guapa/shared'

/** Precio que realmente se cobra: el de oferta si el producto tiene una activa, si no el de lista. */
export function precioEfectivo(producto: Pick<Producto, 'precioVenta' | 'precioOferta'>): number {
  return producto.precioOferta ?? producto.precioVenta
}
