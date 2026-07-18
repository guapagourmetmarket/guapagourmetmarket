import {
  diferenciaCaja,
  normalizarCodigoCupon,
  precioConDescuento,
  puntosGanados,
  subtotalConPromocion,
  unidadesAPagarNxM,
} from './calculos';

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

describe('unidadesAPagarNxM', () => {
  it('cobra M por cada grupo completo de N (3x2 con cantidad exacta)', () => {
    expect(unidadesAPagarNxM(3, 3, 2)).toBe(2);
    expect(unidadesAPagarNxM(6, 3, 2)).toBe(4);
  });

  it('lo que no completa un grupo se paga a precio de lista', () => {
    // 5 unidades con 3x2: un grupo completo (paga 2) + 2 sueltas (pagan 2) = 4
    expect(unidadesAPagarNxM(5, 3, 2)).toBe(4);
  });

  it('cantidad menor a N no aplica la promoción', () => {
    expect(unidadesAPagarNxM(2, 3, 2)).toBe(2);
  });

  it('2x1 cobra la mitad redondeando hacia arriba en grupos completos', () => {
    expect(unidadesAPagarNxM(4, 2, 1)).toBe(2);
    expect(unidadesAPagarNxM(5, 2, 1)).toBe(3);
  });
});

describe('subtotalConPromocion', () => {
  it('sin promoción, es precio de lista por cantidad', () => {
    expect(
      subtotalConPromocion(10000, 3, { descuentoPorcentaje: null, promocionN: null, promocionM: null }),
    ).toBe(30000);
  });

  it('aplica el % de descuento cuando no hay promoción N por M', () => {
    expect(
      subtotalConPromocion(10000, 2, { descuentoPorcentaje: 15, promocionN: null, promocionM: null }),
    ).toBe(17000); // 8500 * 2
  });

  it('aplica la promoción N por M cuando está activa (3x2)', () => {
    // 5 unidades de 10000 con 3x2: 4 unidades a pagar * 10000 = 40000
    expect(
      subtotalConPromocion(10000, 5, { descuentoPorcentaje: null, promocionN: 3, promocionM: 2 }),
    ).toBe(40000);
  });

  it('la promoción N por M tiene prioridad si ambas llegaran a estar presentes', () => {
    expect(
      subtotalConPromocion(10000, 3, { descuentoPorcentaje: 15, promocionN: 3, promocionM: 2 }),
    ).toBe(20000); // usa 3x2 (paga 2), no el 15%
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
