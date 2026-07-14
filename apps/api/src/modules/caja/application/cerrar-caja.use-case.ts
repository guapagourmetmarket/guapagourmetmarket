import { Inject, Injectable } from '@nestjs/common';
import { CAJA_REPOSITORY } from '../domain/caja.repository';
import type { CajaRepository } from '../domain/caja.repository';
import type { CierreTurno } from '../domain/turno.entity';

@Injectable()
export class CerrarCajaUseCase {
  constructor(@Inject(CAJA_REPOSITORY) private readonly cajaRepository: CajaRepository) {}

  ejecutar(id: string, cierre: CierreTurno) {
    return this.cajaRepository.cerrar(id, cierre);
  }
}
