import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ProductosController } from './interface/productos.controller';
import { CategoriasController } from './interface/categorias.controller';
import { MarcasController } from './interface/marcas.controller';
import { ListarProductosUseCase } from './application/listar-productos.use-case';
import { BuscarProductosUseCase } from './application/buscar-productos.use-case';
import { CrearProductoUseCase } from './application/crear-producto.use-case';
import { ObtenerProductoUseCase } from './application/obtener-producto.use-case';
import { ActualizarProductoUseCase } from './application/actualizar-producto.use-case';
import { CambiarEstadoProductoUseCase } from './application/cambiar-estado-producto.use-case';
import { AgregarImagenProductoUseCase } from './application/agregar-imagen-producto.use-case';
import { MarcarImagenPrincipalUseCase } from './application/marcar-imagen-principal.use-case';
import { EliminarImagenProductoUseCase } from './application/eliminar-imagen-producto.use-case';
import { DuplicarProductoUseCase } from './application/duplicar-producto.use-case';
import { EliminarProductoUseCase } from './application/eliminar-producto.use-case';
import { ListarCategoriasUseCase } from './application/listar-categorias.use-case';
import { ObtenerOCrearCategoriaUseCase } from './application/obtener-o-crear-categoria.use-case';
import { RenombrarCategoriaUseCase } from './application/renombrar-categoria.use-case';
import { EliminarCategoriaUseCase } from './application/eliminar-categoria.use-case';
import { ListarMarcasUseCase } from './application/listar-marcas.use-case';
import { ObtenerOCrearMarcaUseCase } from './application/obtener-o-crear-marca.use-case';
import { RenombrarMarcaUseCase } from './application/renombrar-marca.use-case';
import { EliminarMarcaUseCase } from './application/eliminar-marca.use-case';
import { ExportarProductosUseCase } from './application/exportar-productos.use-case';
import { GenerarPlantillaProductosUseCase } from './application/generar-plantilla-productos.use-case';
import { GenerarCatalogoPdfUseCase } from './application/generar-catalogo-pdf.use-case';
import { ImportarProductosUseCase } from './application/importar-productos.use-case';
import { ProductosRepositoryPg } from './infrastructure/productos.repository.pg';
import { CategoriasRepositoryPg } from './infrastructure/categorias.repository.pg';
import { MarcasRepositoryPg } from './infrastructure/marcas.repository.pg';
import { PRODUCTOS_REPOSITORY } from './domain/productos.repository';
import { CATEGORIAS_REPOSITORY } from './domain/categorias.repository';
import { MARCAS_REPOSITORY } from './domain/marcas.repository';

@Module({
  imports: [PassportModule],
  controllers: [ProductosController, CategoriasController, MarcasController],
  providers: [
    ListarProductosUseCase,
    BuscarProductosUseCase,
    CrearProductoUseCase,
    ObtenerProductoUseCase,
    ActualizarProductoUseCase,
    CambiarEstadoProductoUseCase,
    AgregarImagenProductoUseCase,
    MarcarImagenPrincipalUseCase,
    EliminarImagenProductoUseCase,
    DuplicarProductoUseCase,
    EliminarProductoUseCase,
    ListarCategoriasUseCase,
    ObtenerOCrearCategoriaUseCase,
    RenombrarCategoriaUseCase,
    EliminarCategoriaUseCase,
    ListarMarcasUseCase,
    ObtenerOCrearMarcaUseCase,
    RenombrarMarcaUseCase,
    EliminarMarcaUseCase,
    ExportarProductosUseCase,
    GenerarPlantillaProductosUseCase,
    GenerarCatalogoPdfUseCase,
    ImportarProductosUseCase,
    { provide: PRODUCTOS_REPOSITORY, useClass: ProductosRepositoryPg },
    { provide: CATEGORIAS_REPOSITORY, useClass: CategoriasRepositoryPg },
    { provide: MARCAS_REPOSITORY, useClass: MarcasRepositoryPg },
  ],
})
export class ProductosModule {}
