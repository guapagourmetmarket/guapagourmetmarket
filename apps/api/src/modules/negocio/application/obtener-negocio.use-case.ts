import { Inject, Injectable } from '@nestjs/common';
import { NEGOCIO_REPOSITORY } from '../domain/negocio.repository';
import type { NegocioRepository } from '../domain/negocio.repository';

@Injectable()
export class ObtenerNegocioUseCase {
  constructor(@Inject(NEGOCIO_REPOSITORY) private readonly negocioRepository: NegocioRepository) {}

  ejecutar() {
    return this.negocioRepository.obtener();
  }
}
