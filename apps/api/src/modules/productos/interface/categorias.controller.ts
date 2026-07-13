import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { ListarCategoriasUseCase } from '../application/listar-categorias.use-case';
import { ObtenerOCrearCategoriaUseCase } from '../application/obtener-o-crear-categoria.use-case';
import { RenombrarCategoriaUseCase } from '../application/renombrar-categoria.use-case';
import { EliminarCategoriaUseCase } from '../application/eliminar-categoria.use-case';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

@Controller('categorias')
export class CategoriasController {
  constructor(
    private readonly listarCategoriasUseCase: ListarCategoriasUseCase,
    private readonly obtenerOCrearCategoriaUseCase: ObtenerOCrearCategoriaUseCase,
    private readonly renombrarCategoriaUseCase: RenombrarCategoriaUseCase,
    private readonly eliminarCategoriaUseCase: EliminarCategoriaUseCase,
  ) {}

  @Get()
  listar() {
    return this.listarCategoriasUseCase.ejecutar();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() dto: CrearCategoriaDto) {
    return this.obtenerOCrearCategoriaUseCase.ejecutar(dto.nombre);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  renombrar(@Param('id') id: string, @Body() dto: CrearCategoriaDto) {
    return this.renombrarCategoriaUseCase.ejecutar(id, dto.nombre);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  eliminar(@Param('id') id: string) {
    return this.eliminarCategoriaUseCase.ejecutar(id);
  }
}
