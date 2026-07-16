import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PedidosController } from './interface/pedidos.controller';
import { ListarPedidosUseCase } from './application/listar-pedidos.use-case';
import { CrearPedidoUseCase } from './application/crear-pedido.use-case';
import { ActualizarPedidoUseCase } from './application/actualizar-pedido.use-case';
import { CambiarEstadoPedidoUseCase } from './application/cambiar-estado-pedido.use-case';
import { EliminarPedidoUseCase } from './application/eliminar-pedido.use-case';
import { PedidosRepositoryPg } from './infrastructure/pedidos.repository.pg';
import { PEDIDOS_REPOSITORY } from './domain/pedidos.repository';

@Module({
  imports: [PassportModule],
  controllers: [PedidosController],
  providers: [
    ListarPedidosUseCase,
    CrearPedidoUseCase,
    ActualizarPedidoUseCase,
    CambiarEstadoPedidoUseCase,
    EliminarPedidoUseCase,
    { provide: PEDIDOS_REPOSITORY, useClass: PedidosRepositoryPg },
  ],
})
export class PedidosModule {}
