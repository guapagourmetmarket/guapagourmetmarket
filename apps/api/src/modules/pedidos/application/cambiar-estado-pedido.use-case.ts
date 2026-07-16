import { Inject, Injectable } from '@nestjs/common';
import { PEDIDOS_REPOSITORY } from '../domain/pedidos.repository';
import type { PedidosRepository } from '../domain/pedidos.repository';
import { EstadoPedidoEncargo } from '../domain/pedido-encargo.entity';

@Injectable()
export class CambiarEstadoPedidoUseCase {
  constructor(@Inject(PEDIDOS_REPOSITORY) private readonly pedidosRepository: PedidosRepository) {}

  ejecutar(id: string, estado: EstadoPedidoEncargo) {
    return this.pedidosRepository.cambiarEstado(id, estado);
  }
}
