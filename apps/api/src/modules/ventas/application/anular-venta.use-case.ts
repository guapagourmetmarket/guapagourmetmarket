import { Inject, Injectable } from '@nestjs/common';
import { VENTAS_REPOSITORY } from '../domain/ventas.repository';
import type { VentasRepository } from '../domain/ventas.repository';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class AnularVentaUseCase {
  constructor(
    @Inject(VENTAS_REPOSITORY) private readonly ventasRepository: VentasRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(id: string, usuarioId: string) {
    const resultado = await this.ventasRepository.anular(id);
    await this.registrarAuditoriaUseCase.ejecutar({
      usuarioId,
      accion: 'anular_venta',
      entidadTipo: 'venta',
      entidadId: id,
    });
    return resultado;
  }
}
