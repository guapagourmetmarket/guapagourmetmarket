import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { InventarioController } from './interface/inventario.controller';
import { ListarMovimientosUseCase } from './application/listar-movimientos.use-case';
import { RegistrarAjusteUseCase } from './application/registrar-ajuste.use-case';
import { ObtenerAlertasUseCase } from './application/obtener-alertas.use-case';
import { InventarioRepositoryPg } from './infrastructure/inventario.repository.pg';
import { INVENTARIO_REPOSITORY } from './domain/inventario.repository';

@Module({
  imports: [PassportModule],
  controllers: [InventarioController],
  providers: [
    ListarMovimientosUseCase,
    RegistrarAjusteUseCase,
    ObtenerAlertasUseCase,
    { provide: INVENTARIO_REPOSITORY, useClass: InventarioRepositoryPg },
  ],
})
export class InventarioModule {}
