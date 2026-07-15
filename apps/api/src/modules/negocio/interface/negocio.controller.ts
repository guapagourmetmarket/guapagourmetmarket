import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ObtenerNegocioUseCase } from '../application/obtener-negocio.use-case';
import { ActualizarNegocioUseCase } from '../application/actualizar-negocio.use-case';
import { ActualizarNegocioDto } from './dto/actualizar-negocio.dto';

@Controller('negocio')
export class NegocioController {
  constructor(
    private readonly obtenerNegocioUseCase: ObtenerNegocioUseCase,
    private readonly actualizarNegocioUseCase: ActualizarNegocioUseCase,
  ) {}

  // Sin guard, a propósito: nombre/NIT/dirección del negocio se muestran en
  // recibos y pantallas antes de iniciar sesión.
  @Get()
  obtener() {
    return this.obtenerNegocioUseCase.ejecutar();
  }

  // Editar los datos legales del negocio queda solo para la administradora.
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador')
  actualizar(@Body() dto: ActualizarNegocioDto) {
    return this.actualizarNegocioUseCase.ejecutar(dto);
  }
}
