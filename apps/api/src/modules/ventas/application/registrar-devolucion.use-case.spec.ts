import { RegistrarDevolucionUseCase } from './registrar-devolucion.use-case';
import type { VentasRepository } from '../domain/ventas.repository';
import type { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

describe('RegistrarDevolucionUseCase', () => {
  function construir() {
    const devolucionResultado = {
      id: 'dev-1',
      ventaItemId: 'item-1',
      cantidad: 2,
      valor: 10000,
      motivo: 'Producto dañado',
      createdAt: new Date().toISOString(),
    };
    const ventasRepository = {
      registrarDevolucion: jest.fn().mockResolvedValue(devolucionResultado),
    } as unknown as jest.Mocked<VentasRepository>;
    const registrarAuditoriaUseCase = {
      ejecutar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RegistrarAuditoriaUseCase>;

    const useCase = new RegistrarDevolucionUseCase(ventasRepository, registrarAuditoriaUseCase);
    return { useCase, ventasRepository, registrarAuditoriaUseCase, devolucionResultado };
  }

  it('registra la devolución en el repositorio con los datos indicados', async () => {
    const { useCase, ventasRepository } = construir();

    await useCase.ejecutar('item-1', { cantidad: 2, motivo: 'Producto dañado', registradoPor: 'user-1' });

    expect(ventasRepository.registrarDevolucion).toHaveBeenCalledWith('item-1', {
      cantidad: 2,
      motivo: 'Producto dañado',
      registradoPor: 'user-1',
    });
  });

  it('deja un registro de auditoría con el usuario y la cantidad', async () => {
    const { useCase, registrarAuditoriaUseCase } = construir();

    await useCase.ejecutar('item-1', { cantidad: 2, motivo: 'Producto dañado', registradoPor: 'user-1' });

    expect(registrarAuditoriaUseCase.ejecutar).toHaveBeenCalledWith({
      usuarioId: 'user-1',
      accion: 'devolucion',
      entidadTipo: 'venta_item',
      entidadId: 'item-1',
      detalle: 'Cantidad: 2 — Producto dañado',
    });
  });

  it('devuelve el resultado del repositorio', async () => {
    const { useCase, devolucionResultado } = construir();

    const resultado = await useCase.ejecutar('item-1', { cantidad: 2, registradoPor: 'user-1' });

    expect(resultado).toEqual(devolucionResultado);
  });
});
