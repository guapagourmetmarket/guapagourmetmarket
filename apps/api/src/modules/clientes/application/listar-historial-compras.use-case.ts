import { Inject, Injectable } from '@nestjs/common';
import { CLIENTES_REPOSITORY } from '../domain/clientes.repository';
import type { ClientesRepository } from '../domain/clientes.repository';

@Injectable()
export class ListarHistorialComprasUseCase {
  constructor(@Inject(CLIENTES_REPOSITORY) private readonly clientesRepository: ClientesRepository) {}

  ejecutar(clienteId: string) {
    return this.clientesRepository.listarHistorialCompras(clienteId);
  }
}
