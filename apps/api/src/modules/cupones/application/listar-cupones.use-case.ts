import { Inject, Injectable } from '@nestjs/common';
import { CUPONES_REPOSITORY } from '../domain/cupones.repository';
import type { CuponesRepository } from '../domain/cupones.repository';

@Injectable()
export class ListarCuponesUseCase {
  constructor(@Inject(CUPONES_REPOSITORY) private readonly cuponesRepository: CuponesRepository) {}

  ejecutar() {
    return this.cuponesRepository.listar();
  }
}
