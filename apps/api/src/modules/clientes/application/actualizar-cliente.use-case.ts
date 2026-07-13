import { Inject, Injectable } from '@nestjs/common';
import { CLIENTES_REPOSITORY } from '../domain/clientes.repository';
import type { ClientesRepository } from '../domain/clientes.repository';
import type { CambiosCliente } from '../domain/cliente.entity';

@Injectable()
export class ActualizarClienteUseCase {
  constructor(@Inject(CLIENTES_REPOSITORY) private readonly clientesRepository: ClientesRepository) {}

  ejecutar(id: string, cambios: CambiosCliente) {
    return this.clientesRepository.actualizar(id, cambios);
  }
}
