import { Inject, Injectable } from '@nestjs/common';
import { CLIENTES_REPOSITORY } from '../domain/clientes.repository';
import type { ClientesRepository } from '../domain/clientes.repository';

@Injectable()
export class CanjearPuntosUseCase {
  constructor(@Inject(CLIENTES_REPOSITORY) private readonly clientesRepository: ClientesRepository) {}

  ejecutar(clienteId: string, puntos: number, motivo: string) {
    return this.clientesRepository.canjearPuntos(clienteId, puntos, motivo);
  }
}
