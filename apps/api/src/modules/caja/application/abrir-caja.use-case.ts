import { Inject, Injectable } from '@nestjs/common';
import { CAJA_REPOSITORY } from '../domain/caja.repository';
import type { CajaRepository } from '../domain/caja.repository';
import type { NuevoTurno } from '../domain/turno.entity';

@Injectable()
export class AbrirCajaUseCase {
  constructor(@Inject(CAJA_REPOSITORY) private readonly cajaRepository: CajaRepository) {}

  ejecutar(turno: NuevoTurno) {
    return this.cajaRepository.abrir(turno);
  }
}
