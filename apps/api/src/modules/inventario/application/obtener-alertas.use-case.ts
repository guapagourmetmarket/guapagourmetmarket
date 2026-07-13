import { Inject, Injectable } from '@nestjs/common';
import { INVENTARIO_REPOSITORY } from '../domain/inventario.repository';
import type { InventarioRepository } from '../domain/inventario.repository';

@Injectable()
export class ObtenerAlertasUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY) private readonly inventarioRepository: InventarioRepository,
  ) {}

  ejecutar(diasVencimiento?: number) {
    return this.inventarioRepository.obtenerAlertas(diasVencimiento);
  }
}
