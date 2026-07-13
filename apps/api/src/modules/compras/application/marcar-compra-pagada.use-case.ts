import { Inject, Injectable } from '@nestjs/common';
import { COMPRAS_REPOSITORY } from '../domain/compras.repository';
import type { ComprasRepository } from '../domain/compras.repository';

@Injectable()
export class MarcarCompraPagadaUseCase {
  constructor(@Inject(COMPRAS_REPOSITORY) private readonly comprasRepository: ComprasRepository) {}

  ejecutar(id: string) {
    return this.comprasRepository.marcarPagada(id);
  }
}
