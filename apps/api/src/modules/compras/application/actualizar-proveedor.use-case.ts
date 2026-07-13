import { Inject, Injectable } from '@nestjs/common';
import { PROVEEDORES_REPOSITORY } from '../domain/proveedores.repository';
import type { ProveedoresRepository } from '../domain/proveedores.repository';
import type { CambiosProveedor } from '../domain/proveedor.entity';

@Injectable()
export class ActualizarProveedorUseCase {
  constructor(
    @Inject(PROVEEDORES_REPOSITORY) private readonly proveedoresRepository: ProveedoresRepository,
  ) {}

  ejecutar(id: string, cambios: CambiosProveedor) {
    return this.proveedoresRepository.actualizar(id, cambios);
  }
}
