import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ProveedoresController } from './interface/proveedores.controller';
import { ComprasController } from './interface/compras.controller';
import { ListarProveedoresUseCase } from './application/listar-proveedores.use-case';
import { ObtenerProveedorUseCase } from './application/obtener-proveedor.use-case';
import { CrearProveedorUseCase } from './application/crear-proveedor.use-case';
import { ActualizarProveedorUseCase } from './application/actualizar-proveedor.use-case';
import { CambiarEstadoProveedorUseCase } from './application/cambiar-estado-proveedor.use-case';
import { ListarComprasUseCase } from './application/listar-compras.use-case';
import { RegistrarCompraUseCase } from './application/registrar-compra.use-case';
import { AnularCompraUseCase } from './application/anular-compra.use-case';
import { ListarCarteraUseCase } from './application/listar-cartera.use-case';
import { MarcarCompraPagadaUseCase } from './application/marcar-compra-pagada.use-case';
import { ProveedoresRepositoryPg } from './infrastructure/proveedores.repository.pg';
import { ComprasRepositoryPg } from './infrastructure/compras.repository.pg';
import { PROVEEDORES_REPOSITORY } from './domain/proveedores.repository';
import { COMPRAS_REPOSITORY } from './domain/compras.repository';

@Module({
  imports: [PassportModule],
  controllers: [ProveedoresController, ComprasController],
  providers: [
    ListarProveedoresUseCase,
    ObtenerProveedorUseCase,
    CrearProveedorUseCase,
    ActualizarProveedorUseCase,
    CambiarEstadoProveedorUseCase,
    ListarComprasUseCase,
    RegistrarCompraUseCase,
    AnularCompraUseCase,
    ListarCarteraUseCase,
    MarcarCompraPagadaUseCase,
    { provide: PROVEEDORES_REPOSITORY, useClass: ProveedoresRepositoryPg },
    { provide: COMPRAS_REPOSITORY, useClass: ComprasRepositoryPg },
  ],
})
export class ComprasModule {}
