import { Inject, Injectable } from '@nestjs/common';
import { CUENTAS_REPOSITORY } from '../domain/cuentas.repository';
import type { CuentasRepository } from '../domain/cuentas.repository';
import { NuevoCuentaItem } from '../domain/cuenta.entity';

@Injectable()
export class AgregarItemCuentaUseCase {
  constructor(@Inject(CUENTAS_REPOSITORY) private readonly cuentasRepository: CuentasRepository) {}

  ejecutar(cuentaId: string, item: NuevoCuentaItem) {
    return this.cuentasRepository.agregarItem(cuentaId, item);
  }
}
