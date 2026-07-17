import { EstadoPedidoWeb, NuevoPedidoWeb, PedidoWeb } from './pedido-web.entity';

export const PEDIDOS_WEB_REPOSITORY = 'PEDIDOS_WEB_REPOSITORY';

export interface PedidosWebRepository {
  crear(nuevo: NuevoPedidoWeb): Promise<PedidoWeb>;
  listar(): Promise<PedidoWeb[]>;
  cambiarEstado(id: string, estado: EstadoPedidoWeb): Promise<PedidoWeb>;
}
