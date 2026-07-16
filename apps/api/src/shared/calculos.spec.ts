import { diferenciaCaja, normalizarCodigoCupon, precioConDescuento, puntosGanados } from './calculos';

describe('precioConDescuento', () => {
  it('devuelve el precio de lista si no hay descuento', () => {
    expect(precioConDescuento(10000, null)).toBe(10000);
  });

  it('aplica el % de descuento y redondea', () => {
    // 10000 * (1 - 15/100) = 8500
    expect(precioConDescuento(10000, 15)).toBe(8500);
  });

  it('redondea al peso más cercano cuando el resultado no es entero', () => {
    // 9990 * (1 - 33/100) = 6693.3 → 6693
    expect(precioConDescuento(9990, 33)).toBe(6693);
  });

  it('un descuento de 100% deja el precio en cero', () => {
    expect(precioConDescuento(10000, 100)).toBe(0);
  });
});

describe('puntosGanados', () => {
  it('da 1 punto por cada 1000 pesos, redondeando hacia abajo', () => {
    expect(puntosGanados(4999)).toBe(4);
    expect(puntosGanados(5000)).toBe(5);
  });

  it('una venta menor a 1000 pesos no gana puntos', () => {
    expect(puntosGanados(999)).toBe(0);
  });

  it('respeta un puntosPorPeso distinto si se indica', () => {
    expect(puntosGanados(4999, 500)).toBe(9);
  });
});

describe('diferenciaCaja', () => {
  it('es positiva cuando sobra efectivo', () => {
    expect(diferenciaCaja(105_000, 100_000)).toBe(5_000);
  });

  it('es negativa cuando falta efectivo', () => {
    expect(diferenciaCaja(95_000, 100_000)).toBe(-5_000);
  });

  it('es cero cuando cuadra exacto', () => {
    expect(diferenciaCaja(100_000, 100_000)).toBe(0);
  });
});

describe('normalizarCodigoCupon', () => {
  it('convierte a mayúsculas', () => {
    expect(normalizarCodigoCupon('verano10')).toBe('VERANO10');
  });

  it('quita espacios al inicio y al final', () => {
    expect(normalizarCodigoCupon('  verano10  ')).toBe('VERANO10');
  });
});
