import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_REPOSITORY } from '../domain/contabilidad.repository';
import type { ContabilidadRepository } from '../domain/contabilidad.repository';

@Injectable()
export class EliminarGastoUseCase {
  constructor(
    @Inject(CONTABILIDAD_REPOSITORY) private readonly contabilidadRepository: ContabilidadRepository,
  ) {}

  ejecutar(id: string) {
    return this.contabilidadRepository.eliminarGasto(id);
  }
}
