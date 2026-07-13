import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ContabilidadController } from './interface/contabilidad.controller';
import { ListarGastosUseCase } from './application/listar-gastos.use-case';
import { CrearGastoUseCase } from './application/crear-gasto.use-case';
import { EliminarGastoUseCase } from './application/eliminar-gasto.use-case';
import { ObtenerFlujoCajaUseCase } from './application/obtener-flujo-caja.use-case';
import { ObtenerEstadoResultadosUseCase } from './application/obtener-estado-resultados.use-case';
import { ContabilidadRepositoryPg } from './infrastructure/contabilidad.repository.pg';
import { CONTABILIDAD_REPOSITORY } from './domain/contabilidad.repository';

@Module({
  imports: [PassportModule],
  controllers: [ContabilidadController],
  providers: [
    ListarGastosUseCase,
    CrearGastoUseCase,
    EliminarGastoUseCase,
    ObtenerFlujoCajaUseCase,
    ObtenerEstadoResultadosUseCase,
    { provide: CONTABILIDAD_REPOSITORY, useClass: ContabilidadRepositoryPg },
  ],
})
export class ContabilidadModule {}
