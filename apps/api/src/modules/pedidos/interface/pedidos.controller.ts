import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ListarPedidosUseCase } from '../application/listar-pedidos.use-case';
import { CrearPedidoUseCase } from '../application/crear-pedido.use-case';
import { ActualizarPedidoUseCase } from '../application/actualizar-pedido.use-case';
import { CambiarEstadoPedidoUseCase } from '../application/cambiar-estado-pedido.use-case';
import { EliminarPedidoUseCase } from '../application/eliminar-pedido.use-case';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarPedidoDto } from './dto/actualizar-pedido.dto';
import { CambiarEstadoPedidoDto } from './dto/cambiar-estado-pedido.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

// Sin RolesGuard a propósito: registrar y ver los encargos por venir es
// operativo para cualquier persona en caja, igual que Clientes o Alertas.
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(
    private readonly listarPedidosUseCase: ListarPedidosUseCase,
    private readonly crearPedidoUseCase: CrearPedidoUseCase,
    private readonly actualizarPedidoUseCase: ActualizarPedidoUseCase,
    private readonly cambiarEstadoPedidoUseCase: CambiarEstadoPedidoUseCase,
    private readonly eliminarPedidoUseCase: EliminarPedidoUseCase,
  ) {}

  @Get()
  listar() {
    return this.listarPedidosUseCase.ejecutar();
  }

  @Post()
  crear(@Body() dto: CrearPedidoDto, @Req() req: RequestConUsuario) {
    return this.crearPedidoUseCase.ejecutar({ ...dto, registradoPor: req.user.id });
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarPedidoDto) {
    return this.actualizarPedidoUseCase.ejecutar(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoPedidoDto) {
    return this.cambiarEstadoPedidoUseCase.ejecutar(id, dto.estado);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id') id: string) {
    return this.eliminarPedidoUseCase.ejecutar(id);
  }
}
