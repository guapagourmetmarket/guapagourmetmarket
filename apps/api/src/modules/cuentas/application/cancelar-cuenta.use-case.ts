import { Inject, Injectable } from '@nestjs/common';
import { CUENTAS_REPOSITORY } from '../domain/cuentas.repository';
import type { CuentasRepository } from '../domain/cuentas.repository';

@Injectable()
export class CancelarCuentaUseCase {
  constructor(@Inject(CUENTAS_REPOSITORY) private readonly cuentasRepository: CuentasRepository) {}

  ejecutar(cuentaId: string) {
    return this.cuentasRepository.cancelar(cuentaId);
  }
}
