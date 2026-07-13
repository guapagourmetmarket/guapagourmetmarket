import { Inject, Injectable } from '@nestjs/common';
import { PROVEEDORES_REPOSITORY } from '../domain/proveedores.repository';
import type { ProveedoresRepository } from '../domain/proveedores.repository';

@Injectable()
export class CambiarEstadoProveedorUseCase {
  constructor(
    @Inject(PROVEEDORES_REPOSITORY) private readonly proveedoresRepository: ProveedoresRepository,
  ) {}

  ejecutar(id: string, activo: boolean) {
    return this.proveedoresRepository.cambiarEstado(id, activo);
  }
}
