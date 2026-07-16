import { Inject, Injectable } from '@nestjs/common';
import { CUENTAS_REPOSITORY } from '../domain/cuentas.repository';
import type { CuentasRepository } from '../domain/cuentas.repository';

@Injectable()
export class AbrirCuentaUseCase {
  constructor(@Inject(CUENTAS_REPOSITORY) private readonly cuentasRepository: CuentasRepository) {}

  ejecutar(nombre: string, abiertaPor: string) {
    return this.cuentasRepository.abrir(nombre, abiertaPor);
  }
}
