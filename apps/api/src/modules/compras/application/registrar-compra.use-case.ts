import { Inject, Injectable } from '@nestjs/common';
import { COMPRAS_REPOSITORY } from '../domain/compras.repository';
import type { ComprasRepository } from '../domain/compras.repository';
import type { NuevaCompra } from '../domain/compra.entity';

@Injectable()
export class RegistrarCompraUseCase {
  constructor(@Inject(COMPRAS_REPOSITORY) private readonly comprasRepository: ComprasRepository) {}

  ejecutar(compra: NuevaCompra) {
    return this.comprasRepository.registrar(compra);
  }
}
