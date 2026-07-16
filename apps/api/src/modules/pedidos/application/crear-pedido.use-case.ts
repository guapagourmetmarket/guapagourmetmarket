import { Inject, Injectable } from '@nestjs/common';
import { PEDIDOS_REPOSITORY } from '../domain/pedidos.repository';
import type { PedidosRepository } from '../domain/pedidos.repository';
import { NuevoPedidoEncargo } from '../domain/pedido-encargo.entity';

@Injectable()
export class CrearPedidoUseCase {
  constructor(@Inject(PEDIDOS_REPOSITORY) private readonly pedidosRepository: PedidosRepository) {}

  ejecutar(nuevo: NuevoPedidoEncargo) {
    return this.pedidosRepository.crear(nuevo);
  }
}
