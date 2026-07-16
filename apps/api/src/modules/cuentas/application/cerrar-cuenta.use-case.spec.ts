import { BadRequestException } from '@nestjs/common';
import { CerrarCuentaUseCase } from './cerrar-cuenta.use-case';
import type { CuentasRepository } from '../domain/cuentas.repository';
import type { CuentaAbierta } from '../domain/cuenta.entity';
import type { RegistrarVentaUseCase } from '../../ventas/application/registrar-venta.use-case';
import type { Venta } from '../../ventas/domain/venta.entity';

function cuentaFixture(overrides: Partial<CuentaAbierta> = {}): CuentaAbierta {
  return {
    id: 'cuenta-1',
    nombre: 'Marta',
    estado: 'abierta',
    ventaId: null,
    createdAt: new Date().toISOString(),
    items: [],
    total: 0,
    ...overrides,
  };
}

function ventaFixture(): Venta {
  return {
    id: 'venta-1',
    numero: 42,
    fecha: '2026-01-01',
    clienteId: null,
    clienteNombre: 'Marta',
    descripcion: null,
    valor: 10_000,
    descuento: 0,
    metodoPago: 'efectivo',
    origen: 'pos',
    pagado: true,
    fechaVencimientoPago: null,
    items: [],
  };
}

describe('CerrarCuentaUseCase', () => {
  function construir(cuenta: CuentaAbierta) {
    const cuentasRepository: jest.Mocked<CuentasRepository> = {
      listarAbiertas: jest.fn(),
      obtener: jest.fn().mockResolvedValue(cuenta),
      abrir: jest.fn(),
      agregarItem: jest.fn(),
      quitarItem: jest.fn(),
      marcarCerrada: jest.fn().mockResolvedValue(undefined),
      cancelar: jest.fn(),
    };
    const registrarVentaUseCase = {
      ejecutar: jest.fn().mockResolvedValue(ventaFixture()),
    } as unknown as jest.Mocked<RegistrarVentaUseCase>;

    const useCase = new CerrarCuentaUseCase(cuentasRepository, registrarVentaUseCase);
    return { useCase, cuentasRepository, registrarVentaUseCase };
  }

  it('rechaza cerrar una cuenta que ya está cerrada', async () => {
    const { useCase } = construir(cuentaFixture({ estado: 'cerrada' }));
    await expect(useCase.ejecutar('cuenta-1', { metodoPago: 'efectivo' }, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza cobrar una cuenta sin items', async () => {
    const { useCase } = construir(cuentaFixture({ items: [] }));
    await expect(useCase.ejecutar('cuenta-1', { metodoPago: 'efectivo' }, 'user-1')).rejects.toThrow(
      'La cuenta no tiene nada para cobrar todavía.',
    );
  });

  it('separa los items de producto de los items libres al armar la venta', async () => {
    const cuenta = cuentaFixture({
      items: [
        { id: 'i1', productoId: 'prod-1', nombre: 'Aceite de coco', cantidad: 2, precioUnitario: 20000, subtotal: 40000 },
        { id: 'i2', productoId: null, nombre: 'Torta personalizada', cantidad: 1, precioUnitario: 50000, subtotal: 50000 },
      ],
      total: 90000,
    });
    const { useCase, registrarVentaUseCase, cuentasRepository } = construir(cuenta);

    const venta = await useCase.ejecutar('cuenta-1', { metodoPago: 'nequi', descuento: 5000 }, 'user-1');

    expect(registrarVentaUseCase.ejecutar).toHaveBeenCalledWith({
      clienteId: undefined,
      clienteNombre: 'Marta',
      descripcion: 'Torta personalizada x1',
      valorLibre: 50000,
      descuento: 5000,
      metodoPago: 'nequi',
      registradoPor: 'user-1',
      items: [{ productoId: 'prod-1', cantidad: 2 }],
    });
    expect(cuentasRepository.marcarCerrada).toHaveBeenCalledWith('cuenta-1', 'venta-1');
    expect(venta.id).toBe('venta-1');
  });

  it('no manda descripción/valorLibre cuando no hay items libres', async () => {
    const cuenta = cuentaFixture({
      items: [
        { id: 'i1', productoId: 'prod-1', nombre: 'Aceite de coco', cantidad: 1, precioUnitario: 20000, subtotal: 20000 },
      ],
      total: 20000,
    });
    const { useCase, registrarVentaUseCase } = construir(cuenta);

    await useCase.ejecutar('cuenta-1', { metodoPago: 'efectivo' }, 'user-1');

    const argumentos = registrarVentaUseCase.ejecutar.mock.calls[0][0];
    expect(argumentos.descripcion).toBeUndefined();
    expect(argumentos.valorLibre).toBeUndefined();
  });
});
