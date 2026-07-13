import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ListarMarcasUseCase } from '../application/listar-marcas.use-case';
import { ObtenerOCrearMarcaUseCase } from '../application/obtener-o-crear-marca.use-case';
import { RenombrarMarcaUseCase } from '../application/renombrar-marca.use-case';
import { EliminarMarcaUseCase } from '../application/eliminar-marca.use-case';
import { CrearMarcaDto } from './dto/crear-marca.dto';

@Controller('marcas')
export class MarcasController {
  constructor(
    private readonly listarMarcasUseCase: ListarMarcasUseCase,
    private readonly obtenerOCrearMarcaUseCase: ObtenerOCrearMarcaUseCase,
    private readonly renombrarMarcaUseCase: RenombrarMarcaUseCase,
    private readonly eliminarMarcaUseCase: EliminarMarcaUseCase,
  ) {}

  @Get()
  listar() {
    return this.listarMarcasUseCase.ejecutar();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() dto: CrearMarcaDto) {
    return this.obtenerOCrearMarcaUseCase.ejecutar(dto.nombre);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  renombrar(@Param('id') id: string, @Body() dto: CrearMarcaDto) {
    return this.renombrarMarcaUseCase.ejecutar(id, dto.nombre);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  eliminar(@Param('id') id: string) {
    return this.eliminarMarcaUseCase.ejecutar(id);
  }
}
