import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ListarGastosUseCase } from '../application/listar-gastos.use-case';
import { CrearGastoUseCase } from '../application/crear-gasto.use-case';
import { EliminarGastoUseCase } from '../application/eliminar-gasto.use-case';
import { ObtenerFlujoCajaUseCase } from '../application/obtener-flujo-caja.use-case';
import { ObtenerEstadoResultadosUseCase } from '../application/obtener-estado-resultados.use-case';
import { CrearGastoDto } from './dto/crear-gasto.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

function primerDiaDelMes(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ContabilidadController {
  constructor(
    private readonly listarGastosUseCase: ListarGastosUseCase,
    private readonly crearGastoUseCase: CrearGastoUseCase,
    private readonly eliminarGastoUseCase: EliminarGastoUseCase,
    private readonly obtenerFlujoCajaUseCase: ObtenerFlujoCajaUseCase,
    private readonly obtenerEstadoResultadosUseCase: ObtenerEstadoResultadosUseCase,
  ) {}

  @Get('gastos')
  listarGastos(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.listarGastosUseCase.ejecutar(desde, hasta);
  }

  @Post('gastos')
  crearGasto(@Body() dto: CrearGastoDto, @Req() req: RequestConUsuario) {
    return this.crearGastoUseCase.ejecutar({ ...dto, registradoPor: req.user.id });
  }

  @Delete('gastos/:id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  eliminarGasto(@Param('id') id: string) {
    return this.eliminarGastoUseCase.ejecutar(id);
  }

  @Get('contabilidad/flujo-caja')
  obtenerFlujoCaja(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.obtenerFlujoCajaUseCase.ejecutar(desde ?? primerDiaDelMes(), hasta ?? hoyIso());
  }

  @Get('contabilidad/estado-resultados')
  obtenerEstadoResultados(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.obtenerEstadoResultadosUseCase.ejecutar(desde ?? primerDiaDelMes(), hasta ?? hoyIso());
  }
}
