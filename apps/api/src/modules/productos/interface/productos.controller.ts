import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { subirImagenProductoACloudinary } from '../infrastructure/cloudinary';
import { ListarProductosUseCase } from '../application/listar-productos.use-case';
import { BuscarProductosUseCase } from '../application/buscar-productos.use-case';
import { CrearProductoUseCase } from '../application/crear-producto.use-case';
import { ObtenerProductoUseCase } from '../application/obtener-producto.use-case';
import { ActualizarProductoUseCase } from '../application/actualizar-producto.use-case';
import { CambiarEstadoProductoUseCase } from '../application/cambiar-estado-producto.use-case';
import { CambiarFavoritoProductoUseCase } from '../application/cambiar-favorito-producto.use-case';
import { AgregarImagenProductoUseCase } from '../application/agregar-imagen-producto.use-case';
import { MarcarImagenPrincipalUseCase } from '../application/marcar-imagen-principal.use-case';
import { EliminarImagenProductoUseCase } from '../application/eliminar-imagen-producto.use-case';
import { DuplicarProductoUseCase } from '../application/duplicar-producto.use-case';
import { EliminarProductoUseCase } from '../application/eliminar-producto.use-case';
import { ExportarProductosUseCase } from '../application/exportar-productos.use-case';
import { GenerarPlantillaProductosUseCase } from '../application/generar-plantilla-productos.use-case';
import { GenerarCatalogoPdfUseCase } from '../application/generar-catalogo-pdf.use-case';
import { ImportarProductosUseCase } from '../application/importar-productos.use-case';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CambiarFavoritoDto } from './dto/cambiar-favorito.dto';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface RequestConUsuario extends Request {
  user: { id: string; email: string; rol: string };
}

@Controller('productos')
export class ProductosController {
  constructor(
    private readonly listarProductosUseCase: ListarProductosUseCase,
    private readonly buscarProductosUseCase: BuscarProductosUseCase,
    private readonly crearProductoUseCase: CrearProductoUseCase,
    private readonly obtenerProductoUseCase: ObtenerProductoUseCase,
    private readonly actualizarProductoUseCase: ActualizarProductoUseCase,
    private readonly cambiarEstadoProductoUseCase: CambiarEstadoProductoUseCase,
    private readonly cambiarFavoritoProductoUseCase: CambiarFavoritoProductoUseCase,
    private readonly agregarImagenProductoUseCase: AgregarImagenProductoUseCase,
    private readonly marcarImagenPrincipalUseCase: MarcarImagenPrincipalUseCase,
    private readonly eliminarImagenProductoUseCase: EliminarImagenProductoUseCase,
    private readonly duplicarProductoUseCase: DuplicarProductoUseCase,
    private readonly eliminarProductoUseCase: EliminarProductoUseCase,
    private readonly exportarProductosUseCase: ExportarProductosUseCase,
    private readonly generarPlantillaProductosUseCase: GenerarPlantillaProductosUseCase,
    private readonly generarCatalogoPdfUseCase: GenerarCatalogoPdfUseCase,
    private readonly importarProductosUseCase: ImportarProductosUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listar(@Query('incluirInactivos') incluirInactivos?: string) {
    return this.listarProductosUseCase.ejecutar(incluirInactivos === 'true');
  }

  @Get('buscar')
  @UseGuards(JwtAuthGuard)
  buscar(@Query('q') q?: string) {
    return this.buscarProductosUseCase.ejecutar(q ?? '');
  }

  // Sin guard, a propósito: alimenta la tienda pública (/tienda). Solo
  // expone los campos que un cliente puede ver — nunca precioCompra,
  // costoPromedio, existencias exactas, stockMinimo ni códigos internos.
  @Get('publico')
  async publico() {
    const productos = await this.listarProductosUseCase.ejecutar(false);
    return productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precioVenta: p.precioVenta,
      descuentoPorcentaje: p.descuentoPorcentaje,
      precioOferta: p.precioOferta,
      categoriaNombre: p.categoriaNombre,
      marcaNombre: p.marcaNombre,
      unidadMedida: p.unidadMedida,
      imagenUrl: p.imagenUrl,
      disponible: p.existencias > 0,
    }));
  }

  @Get('exportar')
  @UseGuards(JwtAuthGuard)
  async exportar(@Res() res: Response) {
    const buffer = await this.exportarProductosUseCase.ejecutar();
    res.set({
      'Content-Type': XLSX_MIME,
      'Content-Disposition': 'attachment; filename="productos-guapa-gourmet.xlsx"',
    });
    res.send(buffer);
  }

  @Get('plantilla')
  @UseGuards(JwtAuthGuard)
  async plantilla(@Res() res: Response) {
    const buffer = await this.generarPlantillaProductosUseCase.ejecutar();
    res.set({
      'Content-Type': XLSX_MIME,
      'Content-Disposition': 'attachment; filename="plantilla-productos-guapa-gourmet.xlsx"',
    });
    res.send(buffer);
  }

  // Sin guard: el catálogo está pensado para compartirse con clientes
  // (por ejemplo, desde el código QR de la página pública /enlaces).
  @Get('catalogo-pdf')
  async catalogoPdf(@Res() res: Response) {
    const buffer = await this.generarCatalogoPdfUseCase.ejecutar();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="catalogo-guapa-gourmet.pdf"',
    });
    res.send(buffer);
  }

  @Post('importar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const permitido =
          /\.(xlsx|csv)$/i.test(file.originalname) ||
          file.mimetype === XLSX_MIME ||
          file.mimetype === 'text/csv';
        if (!permitido) {
          cb(new BadRequestException('Solo se aceptan archivos .xlsx o .csv.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  importar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }
    const esCsv = /\.csv$/i.test(file.originalname) || file.mimetype === 'text/csv';
    return this.importarProductosUseCase.ejecutar(file.buffer, esCsv);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() dto: CrearProductoDto) {
    return this.crearProductoUseCase.ejecutar(dto);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.obtenerProductoUseCase.ejecutar(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarProductoDto) {
    return this.actualizarProductoUseCase.ejecutar(id, dto);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    return this.cambiarEstadoProductoUseCase.ejecutar(id, dto.activo);
  }

  @Patch(':id/favorito')
  @UseGuards(JwtAuthGuard)
  cambiarFavorito(@Param('id') id: string, @Body() dto: CambiarFavoritoDto) {
    return this.cambiarFavoritoProductoUseCase.ejecutar(id, dto.favoritoPos);
  }

  @Post(':id/duplicar')
  @UseGuards(JwtAuthGuard)
  duplicar(@Param('id') id: string) {
    return this.duplicarProductoUseCase.ejecutar(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  eliminar(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.eliminarProductoUseCase.ejecutar(id, req.user.id);
  }

  @Post(':id/imagen')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
          cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async subirImagen(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ninguna imagen.');
    }
    // Se sube a Cloudinary (almacenamiento permanente) en vez del disco del
    // servidor: en el plan gratis de Render el disco se borra en cada
    // despliegue y las fotos se perderían.
    const url = await subirImagenProductoACloudinary(file.buffer);
    return this.agregarImagenProductoUseCase.ejecutar(id, url);
  }

  @Patch(':id/imagen/:imagenId/principal')
  @UseGuards(JwtAuthGuard)
  marcarImagenPrincipal(@Param('id') id: string, @Param('imagenId') imagenId: string) {
    return this.marcarImagenPrincipalUseCase.ejecutar(id, imagenId);
  }

  @Delete(':id/imagen/:imagenId')
  @UseGuards(JwtAuthGuard)
  eliminarImagen(@Param('id') id: string, @Param('imagenId') imagenId: string) {
    return this.eliminarImagenProductoUseCase.ejecutar(id, imagenId);
  }
}
