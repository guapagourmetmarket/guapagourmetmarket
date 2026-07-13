import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_REPOSITORY } from '../domain/contabilidad.repository';
import type { ContabilidadRepository } from '../domain/contabilidad.repository';
import type { NuevoGasto } from '../domain/gasto.entity';

@Injectable()
export class CrearGastoUseCase {
  constructor(
    @Inject(CONTABILIDAD_REPOSITORY) private readonly contabilidadRepository: ContabilidadRepository,
  ) {}

  ejecutar(nuevo: NuevoGasto) {
    return this.contabilidadRepository.crearGasto(nuevo);
  }
}
