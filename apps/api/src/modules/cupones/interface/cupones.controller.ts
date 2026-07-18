import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ListarCuponesUseCase } from '../application/listar-cupones.use-case';
import { CrearCuponUseCase } from '../application/crear-cupon.use-case';
import { CambiarEstadoCuponUseCase } from '../application/cambiar-estado-cupon.use-case';
import { EliminarCuponUseCase } from '../application/eliminar-cupon.use-case';
import { ValidarCuponUseCase } from '../application/validar-cupon.use-case';
import { CrearCuponDto } from './dto/crear-cupon.dto';
import { CambiarEstadoCuponDto } from './dto/cambiar-estado-cupon.dto';
import { ValidarCuponDto } from './dto/validar-cupon.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('cupones')
export class CuponesController {
  constructor(
    private readonly listarCuponesUseCase: ListarCuponesUseCase,
    private readonly crearCuponUseCase: CrearCuponUseCase,
    private readonly cambiarEstadoCuponUseCase: CambiarEstadoCuponUseCase,
    private readonly eliminarCuponUseCase: EliminarCuponUseCase,
    private readonly validarCuponUseCase: ValidarCuponUseCase,
  ) {}

  // Sin guardia a propósito: lo llama tanto el POS interno (cualquier rol
  // autenticado) como la tienda pública (sin sesión, al aplicar un cupón en
  // el checkout). Solo confirma si un código existe y está activo, no
  // expone nada sensible.
  @Post('validar')
  validar(@Body() dto: ValidarCuponDto) {
    return this.validarCuponUseCase.ejecutar(dto.codigo);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  listar() {
    return this.listarCuponesUseCase.ejecutar();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  crear(@Body() dto: CrearCuponDto) {
    return this.crearCuponUseCase.ejecutar(dto);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoCuponDto) {
    return this.cambiarEstadoCuponUseCase.ejecutar(id, dto.activo);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'contador', 'supervisor')
  eliminar(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.eliminarCuponUseCase.ejecutar(id, req.user.id);
  }
}
