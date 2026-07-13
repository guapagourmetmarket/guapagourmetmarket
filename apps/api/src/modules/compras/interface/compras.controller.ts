import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ListarComprasUseCase } from '../application/listar-compras.use-case';
import { RegistrarCompraUseCase } from '../application/registrar-compra.use-case';
import { AnularCompraUseCase } from '../application/anular-compra.use-case';
import { ListarCarteraUseCase } from '../application/listar-cartera.use-case';
import { MarcarCompraPagadaUseCase } from '../application/marcar-compra-pagada.use-case';
import { RegistrarCompraDto } from './dto/registrar-compra.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('compras')
@UseGuards(JwtAuthGuard)
export class ComprasController {
  constructor(
    private readonly listarComprasUseCase: ListarComprasUseCase,
    private readonly registrarCompraUseCase: RegistrarCompraUseCase,
    private readonly anularCompraUseCase: AnularCompraUseCase,
    private readonly listarCarteraUseCase: ListarCarteraUseCase,
    private readonly marcarCompraPagadaUseCase: MarcarCompraPagadaUseCase,
  ) {}

  @Get()
  listar() {
    return this.listarComprasUseCase.ejecutar();
  }

  @Get('cartera')
  listarCartera() {
    return this.listarCarteraUseCase.ejecutar();
  }

  @Post()
  registrar(@Body() dto: RegistrarCompraDto, @Req() req: RequestConUsuario) {
    return this.registrarCompraUseCase.ejecutar({
      proveedorId: dto.proveedorId,
      fecha: dto.fecha,
      numeroFacturaProveedor: dto.numeroFacturaProveedor,
      metodoPago: dto.metodoPago,
      notas: dto.notas,
      fechaVencimientoPago: dto.fechaVencimientoPago,
      registradoPor: req.user.id,
      items: dto.items,
    });
  }

  @Patch(':id/pagar')
  @UseGuards(RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  marcarPagada(@Param('id') id: string) {
    return this.marcarCompraPagadaUseCase.ejecutar(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  anular(@Param('id') id: string) {
    return this.anularCompraUseCase.ejecutar(id);
  }
}
