import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ListarAuditoriaUseCase } from '../application/listar-auditoria.use-case';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
export class AuditoriaController {
  constructor(private readonly listarAuditoriaUseCase: ListarAuditoriaUseCase) {}

  @Get()
  listar(@Query('limite') limite?: string) {
    return this.listarAuditoriaUseCase.ejecutar(limite ? Number(limite) : undefined);
  }
}
