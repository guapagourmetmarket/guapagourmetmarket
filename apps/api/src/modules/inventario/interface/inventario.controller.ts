import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ListarMovimientosUseCase } from '../application/listar-movimientos.use-case';
import { RegistrarAjusteUseCase } from '../application/registrar-ajuste.use-case';
import { ObtenerAlertasUseCase } from '../application/obtener-alertas.use-case';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('inventario')
@UseGuards(JwtAuthGuard)
export class InventarioController {
  constructor(
    private readonly listarMovimientosUseCase: ListarMovimientosUseCase,
    private readonly registrarAjusteUseCase: RegistrarAjusteUseCase,
    private readonly obtenerAlertasUseCase: ObtenerAlertasUseCase,
  ) {}

  // El kardex trae costo unitario; reservado igual que Compras/Reportes.
  @Get('movimientos')
  @UseGuards(RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  listarMovimientos(@Query('productoId') productoId: string) {
    return this.listarMovimientosUseCase.ejecutar(productoId);
  }

  // Sin restringir: "poco stock" o "por vencer" le sirve a cualquiera en
  // el mostrador, y no expone precios ni costos.
  @Get('alertas')
  obtenerAlertas(@Query('diasVencimiento') diasVencimiento?: string) {
    return this.obtenerAlertasUseCase.ejecutar(
      diasVencimiento ? Number(diasVencimiento) : undefined,
    );
  }

  @Post('ajustes')
  @UseGuards(RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  registrarAjuste(@Body() dto: RegistrarAjusteDto, @Req() req: RequestConUsuario) {
    return this.registrarAjusteUseCase.ejecutar({
      productoId: dto.productoId,
      cantidadNueva: dto.cantidadNueva,
      motivo: dto.motivo,
      registradoPor: req.user.id,
    });
  }
}
