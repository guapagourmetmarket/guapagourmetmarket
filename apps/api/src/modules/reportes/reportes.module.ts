import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ReportesController } from './interface/reportes.controller';
import { ObtenerResumenUseCase } from './application/obtener-resumen.use-case';
import { VentasPorDiaUseCase } from './application/ventas-por-dia.use-case';
import { TopProductosUseCase } from './application/top-productos.use-case';
import { VentasPorCategoriaUseCase } from './application/ventas-por-categoria.use-case';
import { VentasPorEmpleadoUseCase } from './application/ventas-por-empleado.use-case';
import { MargenProductosUseCase } from './application/margen-productos.use-case';
import { ReportesRepositoryPg } from './infrastructure/reportes.repository.pg';
import { REPORTES_REPOSITORY } from './domain/reportes.repository';

@Module({
  imports: [PassportModule],
  controllers: [ReportesController],
  providers: [
    ObtenerResumenUseCase,
    VentasPorDiaUseCase,
    TopProductosUseCase,
    VentasPorCategoriaUseCase,
    VentasPorEmpleadoUseCase,
    MargenProductosUseCase,
    { provide: REPORTES_REPOSITORY, useClass: ReportesRepositoryPg },
  ],
})
export class ReportesModule {}
