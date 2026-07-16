import { Inject, Injectable } from '@nestjs/common';
import { VENTAS_REPOSITORY } from '../domain/ventas.repository';
import type { VentasRepository } from '../domain/ventas.repository';
import { NuevaDevolucion } from '../domain/venta.entity';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class RegistrarDevolucionUseCase {
  constructor(
    @Inject(VENTAS_REPOSITORY) private readonly ventasRepository: VentasRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(ventaItemId: string, devolucion: NuevaDevolucion) {
    const resultado = await this.ventasRepository.registrarDevolucion(ventaItemId, devolucion);
    await this.registrarAuditoriaUseCase.ejecutar({
      usuarioId: devolucion.registradoPor,
      accion: 'devolucion',
      entidadTipo: 'venta_item',
      entidadId: ventaItemId,
      detalle: `Cantidad: ${devolucion.cantidad}${devolucion.motivo ? ` — ${devolucion.motivo}` : ''}`,
    });
    return resultado;
  }
}
