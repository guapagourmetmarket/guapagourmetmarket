import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ObtenerResumenUseCase } from '../application/obtener-resumen.use-case';
import { VentasPorDiaUseCase } from '../application/ventas-por-dia.use-case';
import { TopProductosUseCase } from '../application/top-productos.use-case';
import { VentasPorCategoriaUseCase } from '../application/ventas-por-categoria.use-case';
import { VentasPorEmpleadoUseCase } from '../application/ventas-por-empleado.use-case';
import { MargenProductosUseCase } from '../application/margen-productos.use-case';

function primerDiaDelMes(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(
    private readonly obtenerResumenUseCase: ObtenerResumenUseCase,
    private readonly ventasPorDiaUseCase: VentasPorDiaUseCase,
    private readonly topProductosUseCase: TopProductosUseCase,
    private readonly ventasPorCategoriaUseCase: VentasPorCategoriaUseCase,
    private readonly ventasPorEmpleadoUseCase: VentasPorEmpleadoUseCase,
    private readonly margenProductosUseCase: MargenProductosUseCase,
  ) {}

  @Get('resumen')
  obtenerResumen() {
    return this.obtenerResumenUseCase.ejecutar();
  }

  @Get('ventas-por-dia')
  ventasPorDia(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.ventasPorDiaUseCase.ejecutar(desde ?? primerDiaDelMes(), hasta ?? hoyIso());
  }

  @Get('top-productos')
  topProductos(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('orden') orden?: 'mas' | 'menos',
    @Query('limite') limite?: string,
  ) {
    return this.topProductosUseCase.ejecutar(
      desde ?? primerDiaDelMes(),
      hasta ?? hoyIso(),
      orden === 'menos' ? 'menos' : 'mas',
      Number(limite) > 0 ? Number(limite) : 10,
    );
  }

  @Get('ventas-por-categoria')
  ventasPorCategoria(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.ventasPorCategoriaUseCase.ejecutar(desde ?? primerDiaDelMes(), hasta ?? hoyIso());
  }

  @Get('ventas-por-empleado')
  ventasPorEmpleado(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.ventasPorEmpleadoUseCase.ejecutar(desde ?? primerDiaDelMes(), hasta ?? hoyIso());
  }

  @Get('margen-productos')
  margenProductos(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('limite') limite?: string,
  ) {
    return this.margenProductosUseCase.ejecutar(
      desde ?? primerDiaDelMes(),
      hasta ?? hoyIso(),
      Number(limite) > 0 ? Number(limite) : 10,
    );
  }
}
