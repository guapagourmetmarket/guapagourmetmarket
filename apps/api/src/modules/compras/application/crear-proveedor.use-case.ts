import { Inject, Injectable } from '@nestjs/common';
import { PROVEEDORES_REPOSITORY } from '../domain/proveedores.repository';
import type { ProveedoresRepository } from '../domain/proveedores.repository';
import type { NuevoProveedor } from '../domain/proveedor.entity';

@Injectable()
export class CrearProveedorUseCase {
  constructor(
    @Inject(PROVEEDORES_REPOSITORY) private readonly proveedoresRepository: ProveedoresRepository,
  ) {}

  ejecutar(nuevo: NuevoProveedor) {
    return this.proveedoresRepository.crear(nuevo);
  }
}
