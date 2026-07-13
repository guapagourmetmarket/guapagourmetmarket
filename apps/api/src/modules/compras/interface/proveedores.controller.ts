import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ListarProveedoresUseCase } from '../application/listar-proveedores.use-case';
import { ObtenerProveedorUseCase } from '../application/obtener-proveedor.use-case';
import { CrearProveedorUseCase } from '../application/crear-proveedor.use-case';
import { ActualizarProveedorUseCase } from '../application/actualizar-proveedor.use-case';
import { CambiarEstadoProveedorUseCase } from '../application/cambiar-estado-proveedor.use-case';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';

@Controller('proveedores')
@UseGuards(JwtAuthGuard)
export class ProveedoresController {
  constructor(
    private readonly listarProveedoresUseCase: ListarProveedoresUseCase,
    private readonly obtenerProveedorUseCase: ObtenerProveedorUseCase,
    private readonly crearProveedorUseCase: CrearProveedorUseCase,
    private readonly actualizarProveedorUseCase: ActualizarProveedorUseCase,
    private readonly cambiarEstadoProveedorUseCase: CambiarEstadoProveedorUseCase,
  ) {}

  @Get()
  listar(@Query('incluirInactivos') incluirInactivos?: string) {
    return this.listarProveedoresUseCase.ejecutar(incluirInactivos === 'true');
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.obtenerProveedorUseCase.ejecutar(id);
  }

  @Post()
  crear(@Body() dto: CrearProveedorDto) {
    return this.crearProveedorUseCase.ejecutar(dto);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarProveedorDto) {
    return this.actualizarProveedorUseCase.ejecutar(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    return this.cambiarEstadoProveedorUseCase.ejecutar(id, dto.activo);
  }
}
