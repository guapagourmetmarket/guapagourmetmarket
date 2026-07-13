import { Inject, Injectable } from '@nestjs/common';
import { INVENTARIO_REPOSITORY } from '../domain/inventario.repository';
import type { InventarioRepository, NuevoAjuste } from '../domain/inventario.repository';

@Injectable()
export class RegistrarAjusteUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY) private readonly inventarioRepository: InventarioRepository,
  ) {}

  ejecutar(ajuste: NuevoAjuste) {
    return this.inventarioRepository.registrarAjuste(ajuste);
  }
}
