import { Inject, Injectable } from '@nestjs/common';
import { VENTAS_REPOSITORY } from '../domain/ventas.repository';
import type { VentasRepository } from '../domain/ventas.repository';

@Injectable()
export class AnularVentaUseCase {
  constructor(@Inject(VENTAS_REPOSITORY) private readonly ventasRepository: VentasRepository) {}

  ejecutar(id: string) {
    return this.ventasRepository.anular(id);
  }
}
