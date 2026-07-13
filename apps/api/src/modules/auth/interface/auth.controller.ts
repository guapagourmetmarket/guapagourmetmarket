import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginUseCase } from '../application/login.use-case';
import { ActualizarPerfilUseCase } from '../application/actualizar-perfil.use-case';
import { ObtenerPerfilUseCase } from '../application/obtener-perfil.use-case';
import { LoginDto } from './dto/login.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly actualizarPerfilUseCase: ActualizarPerfilUseCase,
    private readonly obtenerPerfilUseCase: ObtenerPerfilUseCase,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.ejecutar(dto.email, dto.password);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Req() req: RequestConUsuario) {
    return this.obtenerPerfilUseCase.ejecutar(req.user.id);
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  actualizarPerfil(@Body() dto: ActualizarPerfilDto, @Req() req: RequestConUsuario) {
    return this.actualizarPerfilUseCase.ejecutar(req.user.id, dto);
  }
}
