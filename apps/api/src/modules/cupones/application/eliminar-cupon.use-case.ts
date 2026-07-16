import { Inject, Injectable } from '@nestjs/common';
import { CUPONES_REPOSITORY } from '../domain/cupones.repository';
import type { CuponesRepository } from '../domain/cupones.repository';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class EliminarCuponUseCase {
  constructor(
    @Inject(CUPONES_REPOSITORY) private readonly cuponesRepository: CuponesRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(id: string, usuarioId: string) {
    const resultado = await this.cuponesRepository.eliminar(id);
    await this.registrarAuditoriaUseCase.ejecutar({
      usuarioId,
      accion: 'eliminar_cupon',
      entidadTipo: 'cupon',
      entidadId: id,
    });
    return resultado;
  }
}
