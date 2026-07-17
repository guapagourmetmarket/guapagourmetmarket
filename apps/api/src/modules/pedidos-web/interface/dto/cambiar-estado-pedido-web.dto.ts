import { IsIn } from 'class-validator';
import type { EstadoPedidoWeb } from '../../domain/pedido-web.entity';

const ESTADOS: EstadoPedidoWeb[] = ['pendiente', 'confirmado', 'despachado', 'cancelado'];

export class CambiarEstadoPedidoWebDto {
  @IsIn(ESTADOS)
  estado!: EstadoPedidoWeb;
}
