import { Inject, Injectable } from '@nestjs/common';
import { CUPONES_REPOSITORY } from '../domain/cupones.repository';
import type { CuponesRepository } from '../domain/cupones.repository';

@Injectable()
export class ValidarCuponUseCase {
  constructor(@Inject(CUPONES_REPOSITORY) private readonly cuponesRepository: CuponesRepository) {}

  ejecutar(codigo: string) {
    return this.cuponesRepository.validar(codigo);
  }
}
