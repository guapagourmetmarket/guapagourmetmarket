import type { Producto } from '@guapa/shared'

/** Precio que realmente se cobra: el de oferta si el producto tiene una activa, si no el de lista. */
export function precioEfectivo(producto: Pick<Producto, 'precioVenta' | 'precioOferta'>): number {
  return producto.precioOferta ?? producto.precioVenta
}

/**
 * Unidades que se cobran en una promoción "lleva N, paga M" (ej. 3x2 →
 * N=3, M=2): por cada grupo completo de N solo se pagan M; lo que sobra
 * sin completar un grupo se paga a precio de lista. Refleja exactamente
 * la misma fórmula que usa el servidor al calcular el total real.
 */
function unidadesAPagarNxM(cantidad: number, n: number, m: number): number {
  const grupos = Math.floor(cantidad / n)
  const resto = cantidad - grupos * n
  return grupos * m + resto
}

type ProductoConPromocion = Pick<Producto, 'precioVenta' | 'precioOferta' | 'promocionN' | 'promocionM'>

/**
 * Subtotal real de una línea del carrito para la cantidad pedida, aplicando
 * la promoción activa del producto (% descuento o "lleva N, paga M"). Es lo
 * que se le muestra a la persona, y coincide con lo que el servidor va a
 * cobrar de verdad.
 */
export function subtotalEfectivo(producto: ProductoConPromocion, cantidad: number): number {
  if (producto.promocionN && producto.promocionM) {
    const unidadesAPagar = unidadesAPagarNxM(cantidad, producto.promocionN, producto.promocionM)
    return Math.round(unidadesAPagar * producto.precioVenta)
  }
  return precioEfectivo(producto) * cantidad
}

/** Texto corto para mostrar la promoción activa de un producto, si tiene. */
export function etiquetaPromocion(
  producto: Pick<Producto, 'descuentoPorcentaje' | 'promocionN' | 'promocionM'>,
): string | null {
  if (producto.promocionN && producto.promocionM) return `${producto.promocionN}x${producto.promocionM}`
  if (producto.descuentoPorcentaje) return `-${producto.descuentoPorcentaje}% OFERTA`
  return null
}
