import {
  CambiosPedidoEncargo,
  EstadoPedidoEncargo,
  NuevoPedidoEncargo,
  PedidoEncargo,
} from './pedido-encargo.entity';

export interface PedidosRepository {
  listar(): Promise<PedidoEncargo[]>;
  crear(nuevo: NuevoPedidoEncargo): Promise<PedidoEncargo>;
  actualizar(id: string, cambios: CambiosPedidoEncargo): Promise<PedidoEncargo>;
  cambiarEstado(id: string, estado: EstadoPedidoEncargo): Promise<PedidoEncargo>;
  eliminar(id: string): Promise<void>;
}

export const PEDIDOS_REPOSITORY = 'PEDIDOS_REPOSITORY';
