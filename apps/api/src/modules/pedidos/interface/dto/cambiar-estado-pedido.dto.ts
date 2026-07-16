import { IsIn } from 'class-validator';
import type { EstadoPedidoEncargo } from '../../domain/pedido-encargo.entity';

const ESTADOS: EstadoPedidoEncargo[] = ['pendiente', 'entregado', 'cancelado'];

export class CambiarEstadoPedidoDto {
  @IsIn(ESTADOS)
  estado!: EstadoPedidoEncargo;
}
