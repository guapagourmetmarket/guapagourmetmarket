import { Inject, Injectable } from '@nestjs/common';
import { CAJA_REPOSITORY } from '../domain/caja.repository';
import type { CajaRepository } from '../domain/caja.repository';

@Injectable()
export class ListarTurnosUseCase {
  constructor(@Inject(CAJA_REPOSITORY) private readonly cajaRepository: CajaRepository) {}

  ejecutar() {
    return this.cajaRepository.listar();
  }
}
