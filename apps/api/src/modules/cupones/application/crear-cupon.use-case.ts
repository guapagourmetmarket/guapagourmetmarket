import { Inject, Injectable } from '@nestjs/common';
import { CUPONES_REPOSITORY } from '../domain/cupones.repository';
import type { CuponesRepository } from '../domain/cupones.repository';
import { NuevoCupon } from '../domain/cupon.entity';

@Injectable()
export class CrearCuponUseCase {
  constructor(@Inject(CUPONES_REPOSITORY) private readonly cuponesRepository: CuponesRepository) {}

  ejecutar(nuevo: NuevoCupon) {
    return this.cuponesRepository.crear(nuevo);
  }
}
