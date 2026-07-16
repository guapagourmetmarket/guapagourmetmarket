import { Inject, Injectable } from '@nestjs/common';
import { CUENTAS_REPOSITORY } from '../domain/cuentas.repository';
import type { CuentasRepository } from '../domain/cuentas.repository';

@Injectable()
export class ListarCuentasUseCase {
  constructor(@Inject(CUENTAS_REPOSITORY) private readonly cuentasRepository: CuentasRepository) {}

  ejecutar() {
    return this.cuentasRepository.listarAbiertas();
  }
}
