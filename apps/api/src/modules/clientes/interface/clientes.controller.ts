import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ListarClientesUseCase } from '../application/listar-clientes.use-case';
import { ObtenerClienteUseCase } from '../application/obtener-cliente.use-case';
import { CrearClienteUseCase } from '../application/crear-cliente.use-case';
import { ActualizarClienteUseCase } from '../application/actualizar-cliente.use-case';
import { CambiarEstadoClienteUseCase } from '../application/cambiar-estado-cliente.use-case';
import { ListarMovimientosPuntosUseCase } from '../application/listar-movimientos-puntos.use-case';
import { CanjearPuntosUseCase } from '../application/canjear-puntos.use-case';
import { ListarHistorialComprasUseCase } from '../application/listar-historial-compras.use-case';
import { ListarCumpleanosUseCase } from '../application/listar-cumpleanos.use-case';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CanjearPuntosDto } from './dto/canjear-puntos.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(
    private readonly listarClientesUseCase: ListarClientesUseCase,
    private readonly obtenerClienteUseCase: ObtenerClienteUseCase,
    private readonly crearClienteUseCase: CrearClienteUseCase,
    private readonly actualizarClienteUseCase: ActualizarClienteUseCase,
    private readonly cambiarEstadoClienteUseCase: CambiarEstadoClienteUseCase,
    private readonly listarMovimientosPuntosUseCase: ListarMovimientosPuntosUseCase,
    private readonly canjearPuntosUseCase: CanjearPuntosUseCase,
    private readonly listarHistorialComprasUseCase: ListarHistorialComprasUseCase,
    private readonly listarCumpleanosUseCase: ListarCumpleanosUseCase,
  ) {}

  @Get()
  listar(@Query('incluirInactivos') incluirInactivos?: string) {
    return this.listarClientesUseCase.ejecutar(incluirInactivos === 'true');
  }

  @Get('cumpleanos')
  listarCumpleanos() {
    return this.listarCumpleanosUseCase.ejecutar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.obtenerClienteUseCase.ejecutar(id);
  }

  @Get(':id/puntos')
  listarMovimientosPuntos(@Param('id') id: string) {
    return this.listarMovimientosPuntosUseCase.ejecutar(id);
  }

  @Get(':id/compras')
  listarHistorialCompras(@Param('id') id: string) {
    return this.listarHistorialComprasUseCase.ejecutar(id);
  }

  @Post()
  crear(@Body() dto: CrearClienteDto) {
    return this.crearClienteUseCase.ejecutar(dto);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return this.actualizarClienteUseCase.ejecutar(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    return this.cambiarEstadoClienteUseCase.ejecutar(id, dto.activo);
  }

  @Post(':id/puntos/canjear')
  canjearPuntos(@Param('id') id: string, @Body() dto: CanjearPuntosDto) {
    return this.canjearPuntosUseCase.ejecutar(id, dto.puntos, dto.motivo);
  }
}
