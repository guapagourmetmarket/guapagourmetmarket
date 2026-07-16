// Cálculos de dinero compartidos entre módulos (ventas, cuentas, caja,
// cupones) — se extraen aparte para poder probarlos sin necesitar una base
// de datos real.

/** Precio de venta ya con el % de descuento del producto aplicado (si tiene). */
export function precioConDescuento(precioLista: number, descuentoPorcentaje: number | null): number {
  if (!descuentoPorcentaje) return precioLista;
  return Math.round(precioLista * (1 - descuentoPorcentaje / 100));
}

/** Puntos de fidelización que gana un cliente por el valor de una venta. */
export function puntosGanados(valorTotal: number, puntosPorPeso = 1000): number {
  return Math.floor(valorTotal / puntosPorPeso);
}

/** Sobra (positivo) o falta (negativo) al cerrar la caja. */
export function diferenciaCaja(efectivoContado: number, efectivoEsperado: number): number {
  return efectivoContado - efectivoEsperado;
}

/** Los códigos de cupón se guardan y comparan siempre en mayúsculas, sin espacios. */
export function normalizarCodigoCupon(codigo: string): string {
  return codigo.trim().toUpperCase();
}
