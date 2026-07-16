import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CuponesController } from './interface/cupones.controller';
import { ListarCuponesUseCase } from './application/listar-cupones.use-case';
import { CrearCuponUseCase } from './application/crear-cupon.use-case';
import { CambiarEstadoCuponUseCase } from './application/cambiar-estado-cupon.use-case';
import { EliminarCuponUseCase } from './application/eliminar-cupon.use-case';
import { ValidarCuponUseCase } from './application/validar-cupon.use-case';
import { CuponesRepositoryPg } from './infrastructure/cupones.repository.pg';
import { CUPONES_REPOSITORY } from './domain/cupones.repository';

@Module({
  imports: [PassportModule],
  controllers: [CuponesController],
  providers: [
    ListarCuponesUseCase,
    CrearCuponUseCase,
    CambiarEstadoCuponUseCase,
    EliminarCuponUseCase,
    ValidarCuponUseCase,
    { provide: CUPONES_REPOSITORY, useClass: CuponesRepositoryPg },
  ],
})
export class CuponesModule {}
