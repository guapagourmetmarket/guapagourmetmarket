import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ClientesController } from './interface/clientes.controller';
import { ListarClientesUseCase } from './application/listar-clientes.use-case';
import { ObtenerClienteUseCase } from './application/obtener-cliente.use-case';
import { CrearClienteUseCase } from './application/crear-cliente.use-case';
import { ActualizarClienteUseCase } from './application/actualizar-cliente.use-case';
import { CambiarEstadoClienteUseCase } from './application/cambiar-estado-cliente.use-case';
import { ListarMovimientosPuntosUseCase } from './application/listar-movimientos-puntos.use-case';
import { CanjearPuntosUseCase } from './application/canjear-puntos.use-case';
import { ListarHistorialComprasUseCase } from './application/listar-historial-compras.use-case';
import { ListarCumpleanosUseCase } from './application/listar-cumpleanos.use-case';
import { ClientesRepositoryPg } from './infrastructure/clientes.repository.pg';
import { CLIENTES_REPOSITORY } from './domain/clientes.repository';

@Module({
  imports: [PassportModule],
  controllers: [ClientesController],
  providers: [
    ListarClientesUseCase,
    ObtenerClienteUseCase,
    CrearClienteUseCase,
    ActualizarClienteUseCase,
    CambiarEstadoClienteUseCase,
    ListarMovimientosPuntosUseCase,
    CanjearPuntosUseCase,
    ListarHistorialComprasUseCase,
    ListarCumpleanosUseCase,
    { provide: CLIENTES_REPOSITORY, useClass: ClientesRepositoryPg },
  ],
})
export class ClientesModule {}
