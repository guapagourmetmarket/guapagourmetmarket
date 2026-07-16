import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ListarCuentasUseCase } from '../application/listar-cuentas.use-case';
import { AbrirCuentaUseCase } from '../application/abrir-cuenta.use-case';
import { AgregarItemCuentaUseCase } from '../application/agregar-item-cuenta.use-case';
import { QuitarItemCuentaUseCase } from '../application/quitar-item-cuenta.use-case';
import { CerrarCuentaUseCase } from '../application/cerrar-cuenta.use-case';
import { CancelarCuentaUseCase } from '../application/cancelar-cuenta.use-case';
import { AbrirCuentaDto } from './dto/abrir-cuenta.dto';
import { AgregarItemCuentaDto } from './dto/agregar-item-cuenta.dto';
import { CerrarCuentaDto } from './dto/cerrar-cuenta.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

// Sin RolesGuard a propósito: abrir/alimentar/cerrar una cuenta es una
// operación de caja, igual de disponible para cualquier rol que registrar()
// en /ventas.
@Controller('cuentas')
@UseGuards(JwtAuthGuard)
export class CuentasController {
  constructor(
    private readonly listarCuentasUseCase: ListarCuentasUseCase,
    private readonly abrirCuentaUseCase: AbrirCuentaUseCase,
    private readonly agregarItemCuentaUseCase: AgregarItemCuentaUseCase,
    private readonly quitarItemCuentaUseCase: QuitarItemCuentaUseCase,
    private readonly cerrarCuentaUseCase: CerrarCuentaUseCase,
    private readonly cancelarCuentaUseCase: CancelarCuentaUseCase,
  ) {}

  @Get()
  listar() {
    return this.listarCuentasUseCase.ejecutar();
  }

  @Post()
  abrir(@Body() dto: AbrirCuentaDto, @Req() req: RequestConUsuario) {
    return this.abrirCuentaUseCase.ejecutar(dto.nombre, req.user.id);
  }

  @Post(':id/items')
  agregarItem(@Param('id') id: string, @Body() dto: AgregarItemCuentaDto) {
    return this.agregarItemCuentaUseCase.ejecutar(id, dto);
  }

  @Delete(':id/items/:itemId')
  quitarItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.quitarItemCuentaUseCase.ejecutar(id, itemId);
  }

  @Post(':id/cerrar')
  cerrar(@Param('id') id: string, @Body() dto: CerrarCuentaDto, @Req() req: RequestConUsuario) {
    return this.cerrarCuentaUseCase.ejecutar(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  cancelar(@Param('id') id: string) {
    return this.cancelarCuentaUseCase.ejecutar(id);
  }
}
