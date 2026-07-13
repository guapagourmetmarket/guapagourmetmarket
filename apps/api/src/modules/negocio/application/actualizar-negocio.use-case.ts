import { Inject, Injectable } from '@nestjs/common';
import { NEGOCIO_REPOSITORY } from '../domain/negocio.repository';
import type { NegocioRepository } from '../domain/negocio.repository';
import type { CambiosNegocio } from '../domain/negocio.entity';

@Injectable()
export class ActualizarNegocioUseCase {
  constructor(@Inject(NEGOCIO_REPOSITORY) private readonly negocioRepository: NegocioRepository) {}

  ejecutar(cambios: CambiosNegocio) {
    return this.negocioRepository.actualizar(cambios);
  }
}
