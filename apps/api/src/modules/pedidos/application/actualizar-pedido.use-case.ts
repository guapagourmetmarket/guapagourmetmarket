import { Inject, Injectable } from '@nestjs/common';
import { PEDIDOS_REPOSITORY } from '../domain/pedidos.repository';
import type { PedidosRepository } from '../domain/pedidos.repository';
import { CambiosPedidoEncargo } from '../domain/pedido-encargo.entity';

@Injectable()
export class ActualizarPedidoUseCase {
  constructor(@Inject(PEDIDOS_REPOSITORY) private readonly pedidosRepository: PedidosRepository) {}

  ejecutar(id: string, cambios: CambiosPedidoEncargo) {
    return this.pedidosRepository.actualizar(id, cambios);
  }
}
