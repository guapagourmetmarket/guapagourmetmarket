import { Inject, Injectable } from '@nestjs/common';
import { PedidoWeb } from '../domain/pedido-web.entity';
import { PEDIDOS_WEB_REPOSITORY } from '../domain/pedidos-web.repository';
import type { PedidosWebRepository } from '../domain/pedidos-web.repository';

@Injectable()
export class ListarPedidosWebUseCase {
  constructor(@Inject(PEDIDOS_WEB_REPOSITORY) private readonly repo: PedidosWebRepository) {}

  ejecutar(): Promise<PedidoWeb[]> {
    return this.repo.listar();
  }
}
