import { Inject, Injectable } from '@nestjs/common';
import { CUENTAS_REPOSITORY } from '../domain/cuentas.repository';
import type { CuentasRepository } from '../domain/cuentas.repository';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class CancelarCuentaUseCase {
  constructor(
    @Inject(CUENTAS_REPOSITORY) private readonly cuentasRepository: CuentasRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(cuentaId: string, usuarioId: string) {
    const resultado = await this.cuentasRepository.cancelar(cuentaId);
    await this.registrarAuditoriaUseCase.ejecutar({
      usuarioId,
      accion: 'cancelar_cuenta',
      entidadTipo: 'cuenta',
      entidadId: cuentaId,
    });
    return resultado;
  }
}
