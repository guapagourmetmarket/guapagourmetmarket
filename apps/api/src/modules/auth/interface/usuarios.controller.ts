import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { CrearUsuarioUseCase } from '../application/crear-usuario.use-case';
import { ListarUsuariosUseCase } from '../application/listar-usuarios.use-case';
import { ActualizarUsuarioUseCase } from '../application/actualizar-usuario.use-case';
import { ResetearPasswordUsuarioUseCase } from '../application/resetear-password-usuario.use-case';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

// Solo administradores: crear cuentas para el equipo (cajero, contador,
// supervisor) es una acción sensible que afecta quién puede entrar al
// sistema y qué puede hacer.
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
export class UsuariosController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly listarUsuariosUseCase: ListarUsuariosUseCase,
    private readonly actualizarUsuarioUseCase: ActualizarUsuarioUseCase,
    private readonly resetearPasswordUsuarioUseCase: ResetearPasswordUsuarioUseCase,
  ) {}

  @Get()
  listar() {
    return this.listarUsuariosUseCase.ejecutar();
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.crearUsuarioUseCase.ejecutar(dto);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto, @Req() req: RequestConUsuario) {
    return this.actualizarUsuarioUseCase.ejecutar(id, dto, req.user.id);
  }

  @Post(':id/resetear-password')
  @HttpCode(200)
  resetearPassword(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.resetearPasswordUsuarioUseCase.ejecutar(id, req.user.id);
  }
}
