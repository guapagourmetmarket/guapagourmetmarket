import { Inject, Injectable } from '@nestjs/common';
import { EstadoPedidoWeb, PedidoWeb } from '../domain/pedido-web.entity';
import { PEDIDOS_WEB_REPOSITORY } from '../domain/pedidos-web.repository';
import type { PedidosWebRepository } from '../domain/pedidos-web.repository';

@Injectable()
export class CambiarEstadoPedidoWebUseCase {
  constructor(@Inject(PEDIDOS_WEB_REPOSITORY) private readonly repo: PedidosWebRepository) {}

  ejecutar(id: string, estado: EstadoPedidoWeb): Promise<PedidoWeb> {
    return this.repo.cambiarEstado(id, estado);
  }
}
