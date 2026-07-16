import { Inject, Injectable } from '@nestjs/common';
import { CUENTAS_REPOSITORY } from '../domain/cuentas.repository';
import type { CuentasRepository } from '../domain/cuentas.repository';

@Injectable()
export class QuitarItemCuentaUseCase {
  constructor(@Inject(CUENTAS_REPOSITORY) private readonly cuentasRepository: CuentasRepository) {}

  ejecutar(cuentaId: string, itemId: string) {
    return this.cuentasRepository.quitarItem(cuentaId, itemId);
  }
}
