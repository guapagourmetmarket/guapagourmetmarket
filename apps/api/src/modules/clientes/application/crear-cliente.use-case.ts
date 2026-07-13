import { Inject, Injectable } from '@nestjs/common';
import { CLIENTES_REPOSITORY } from '../domain/clientes.repository';
import type { ClientesRepository } from '../domain/clientes.repository';
import type { NuevoCliente } from '../domain/cliente.entity';

@Injectable()
export class CrearClienteUseCase {
  constructor(@Inject(CLIENTES_REPOSITORY) private readonly clientesRepository: ClientesRepository) {}

  ejecutar(nuevo: NuevoCliente) {
    return this.clientesRepository.crear(nuevo);
  }
}
