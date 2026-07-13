import { Inject, Injectable } from '@nestjs/common';
import { CLIENTES_REPOSITORY } from '../domain/clientes.repository';
import type { ClientesRepository } from '../domain/clientes.repository';

@Injectable()
export class CambiarEstadoClienteUseCase {
  constructor(@Inject(CLIENTES_REPOSITORY) private readonly clientesRepository: ClientesRepository) {}

  ejecutar(id: string, activo: boolean) {
    return this.clientesRepository.cambiarEstado(id, activo);
  }
}
