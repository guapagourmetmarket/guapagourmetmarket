import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ListarVentasUseCase } from '../application/listar-ventas.use-case';
import { RegistrarVentaUseCase } from '../application/registrar-venta.use-case';
import { AnularVentaUseCase } from '../application/anular-venta.use-case';
import { ListarCarteraClientesUseCase } from '../application/listar-cartera-clientes.use-case';
import { MarcarVentaPagadaUseCase } from '../application/marcar-venta-pagada.use-case';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(
    private readonly listarVentasUseCase: ListarVentasUseCase,
    private readonly registrarVentaUseCase: RegistrarVentaUseCase,
    private readonly anularVentaUseCase: AnularVentaUseCase,
    private readonly listarCarteraClientesUseCase: ListarCarteraClientesUseCase,
    private readonly marcarVentaPagadaUseCase: MarcarVentaPagadaUseCase,
  ) {}

  @Get()
  listar() {
    return this.listarVentasUseCase.ejecutar();
  }

  @Get('cartera')
  listarCartera() {
    return this.listarCarteraClientesUseCase.ejecutar();
  }

  @Post()
  registrar(@Body() dto: RegistrarVentaDto, @Req() req: RequestConUsuario) {
    return this.registrarVentaUseCase.ejecutar({
      fecha: dto.fecha,
      clienteId: dto.clienteId,
      clienteNombre: dto.clienteNombre,
      descripcion: dto.descripcion,
      valorLibre: dto.valorLibre,
      descuento: dto.descuento,
      metodoPago: dto.metodoPago,
      fiado: dto.fiado,
      fechaVencimientoPago: dto.fechaVencimientoPago,
      registradoPor: req.user.id,
      items: dto.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    });
  }

  @Patch(':id/pagar')
  @UseGuards(RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  marcarPagada(@Param('id') id: string) {
    return this.marcarVentaPagadaUseCase.ejecutar(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  anular(@Param('id') id: string) {
    return this.anularVentaUseCase.ejecutar(id);
  }
}
