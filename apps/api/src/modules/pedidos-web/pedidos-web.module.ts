import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PedidosWebController } from './interface/pedidos-web.controller';
import { CrearPedidoWebUseCase } from './application/crear-pedido-web.use-case';
import { ListarPedidosWebUseCase } from './application/listar-pedidos-web.use-case';
import { CambiarEstadoPedidoWebUseCase } from './application/cambiar-estado-pedido-web.use-case';
import { PedidosWebRepositoryPg } from './infrastructure/pedidos-web.repository.pg';
import { PEDIDOS_WEB_REPOSITORY } from './domain/pedidos-web.repository';
import { CuponesModule } from '../cupones/cupones.module';

@Module({
  imports: [PassportModule, CuponesModule],
  controllers: [PedidosWebController],
  providers: [
    CrearPedidoWebUseCase,
    ListarPedidosWebUseCase,
    CambiarEstadoPedidoWebUseCase,
    { provide: PEDIDOS_WEB_REPOSITORY, useClass: PedidosWebRepositoryPg },
  ],
})
export class PedidosWebModule {}
