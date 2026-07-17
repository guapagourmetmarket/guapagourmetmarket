import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { CrearPedidoWebUseCase } from '../application/crear-pedido-web.use-case';
import { ListarPedidosWebUseCase } from '../application/listar-pedidos-web.use-case';
import { CambiarEstadoPedidoWebUseCase } from '../application/cambiar-estado-pedido-web.use-case';
import { CrearPedidoWebDto } from './dto/crear-pedido-web.dto';
import { CambiarEstadoPedidoWebDto } from './dto/cambiar-estado-pedido-web.dto';

@Controller('pedidos-web')
export class PedidosWebController {
  constructor(
    private readonly crearPedidoWebUseCase: CrearPedidoWebUseCase,
    private readonly listarPedidosWebUseCase: ListarPedidosWebUseCase,
    private readonly cambiarEstadoPedidoWebUseCase: CambiarEstadoPedidoWebUseCase,
  ) {}

  // Sin guardia a propósito: lo llama la tienda pública, sin sesión.
  @Post()
  crear(@Body() dto: CrearPedidoWebDto) {
    return this.crearPedidoWebUseCase.ejecutar(dto);
  }

  // Ver y gestionar los pedidos sí requiere sesión (igual que Pedidos por
  // encargo, sin RolesGuard: cualquier persona en caja puede despachar).
  @Get()
  @UseGuards(JwtAuthGuard)
  listar() {
    return this.listarPedidosWebUseCase.ejecutar();
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoPedidoWebDto) {
    return this.cambiarEstadoPedidoWebUseCase.ejecutar(id, dto.estado);
  }
}
