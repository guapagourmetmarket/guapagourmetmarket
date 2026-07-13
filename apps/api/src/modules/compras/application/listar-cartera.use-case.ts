import { Inject, Injectable } from '@nestjs/common';
import { COMPRAS_REPOSITORY } from '../domain/compras.repository';
import type { ComprasRepository } from '../domain/compras.repository';

@Injectable()
export class ListarCarteraUseCase {
  constructor(@Inject(COMPRAS_REPOSITORY) private readonly comprasRepository: ComprasRepository) {}

  ejecutar() {
    return this.comprasRepository.listarCartera();
  }
}
