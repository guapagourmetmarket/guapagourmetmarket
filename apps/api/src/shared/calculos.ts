// Cálculos de dinero compartidos entre módulos (ventas, cuentas, caja,
// cupones) — se extraen aparte para poder probarlos sin necesitar una base
// de datos real.

/** Precio de venta ya con el % de descuento del producto aplicado (si tiene). */
export function precioConDescuento(precioLista: number, descuentoPorcentaje: number | null): number {
  if (!descuentoPorcentaje) return precioLista;
  return Math.round(precioLista * (1 - descuentoPorcentaje / 100));
}

/**
 * Unidades que realmente se cobran en una promoción "lleva N, paga M"
 * (ej. 3x2 → N=3, M=2): por cada grupo completo de N solo se pagan M: lo
 * que sobra sin completar un grupo se paga a precio de lista.
 */
export function unidadesAPagarNxM(cantidad: number, n: number, m: number): number {
  const grupos = Math.floor(cantidad / n);
  const resto = cantidad - grupos * n;
  return grupos * m + resto;
}

/**
 * Subtotal de una línea de venta, aplicando la promoción activa del
 * producto (descuento % o "lleva N, paga M" — nunca las dos a la vez).
 * Sin promoción, es simplemente precio de lista × cantidad.
 */
export function subtotalConPromocion(
  precioLista: number,
  cantidad: number,
  promocion: { descuentoPorcentaje: number | null; promocionN: number | null; promocionM: number | null },
): number {
  if (promocion.promocionN && promocion.promocionM) {
    const unidadesAPagar = unidadesAPagarNxM(cantidad, promocion.promocionN, promocion.promocionM);
    return Math.round(unidadesAPagar * precioLista);
  }
  return Math.round(precioConDescuento(precioLista, promocion.descuentoPorcentaje) * cantidad);
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
