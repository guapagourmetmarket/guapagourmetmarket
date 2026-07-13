import { Inject, Injectable } from '@nestjs/common';
import { INVENTARIO_REPOSITORY } from '../domain/inventario.repository';
import type { InventarioRepository } from '../domain/inventario.repository';

@Injectable()
export class ListarMovimientosUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY) private readonly inventarioRepository: InventarioRepository,
  ) {}

  ejecutar(productoId: string) {
    return this.inventarioRepository.listarMovimientos(productoId);
  }
}
