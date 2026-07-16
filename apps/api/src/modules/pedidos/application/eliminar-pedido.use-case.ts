import { Inject, Injectable } from '@nestjs/common';
import { PEDIDOS_REPOSITORY } from '../domain/pedidos.repository';
import type { PedidosRepository } from '../domain/pedidos.repository';

@Injectable()
export class EliminarPedidoUseCase {
  constructor(@Inject(PEDIDOS_REPOSITORY) private readonly pedidosRepository: PedidosRepository) {}

  ejecutar(id: string) {
    return this.pedidosRepository.eliminar(id);
  }
}
