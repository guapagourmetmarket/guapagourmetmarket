import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ObtenerTurnoAbiertoUseCase } from '../application/obtener-turno-abierto.use-case';
import { AbrirCajaUseCase } from '../application/abrir-caja.use-case';
import { CerrarCajaUseCase } from '../application/cerrar-caja.use-case';
import { ListarTurnosUseCase } from '../application/listar-turnos.use-case';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('caja')
@UseGuards(JwtAuthGuard)
export class CajaController {
  constructor(
    private readonly obtenerTurnoAbiertoUseCase: ObtenerTurnoAbiertoUseCase,
    private readonly abrirCajaUseCase: AbrirCajaUseCase,
    private readonly cerrarCajaUseCase: CerrarCajaUseCase,
    private readonly listarTurnosUseCase: ListarTurnosUseCase,
  ) {}

  @Get('actual')
  actual() {
    return this.obtenerTurnoAbiertoUseCase.ejecutar();
  }

  @Get()
  listar() {
    return this.listarTurnosUseCase.ejecutar();
  }

  @Post('abrir')
  abrir(@Body() dto: AbrirCajaDto, @Req() req: RequestConUsuario) {
    return this.abrirCajaUseCase.ejecutar({ usuarioId: req.user.id, efectivoInicial: dto.efectivoInicial });
  }

  @Post(':id/cerrar')
  cerrar(@Param('id') id: string, @Body() dto: CerrarCajaDto) {
    return this.cerrarCajaUseCase.ejecutar(id, { efectivoContado: dto.efectivoContado, notas: dto.notas });
  }
}
