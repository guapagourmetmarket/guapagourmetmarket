import { Inject, Injectable } from '@nestjs/common';
import { NuevoPedidoWeb, PedidoWeb } from '../domain/pedido-web.entity';
import { PEDIDOS_WEB_REPOSITORY } from '../domain/pedidos-web.repository';
import type { PedidosWebRepository } from '../domain/pedidos-web.repository';

@Injectable()
export class CrearPedidoWebUseCase {
  constructor(@Inject(PEDIDOS_WEB_REPOSITORY) private readonly repo: PedidosWebRepository) {}

  ejecutar(nuevo: NuevoPedidoWeb): Promise<PedidoWeb> {
    return this.repo.crear(nuevo);
  }
}
