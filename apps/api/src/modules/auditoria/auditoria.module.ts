import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuditoriaController } from './interface/auditoria.controller';
import { RegistrarAuditoriaUseCase } from './application/registrar-auditoria.use-case';
import { ListarAuditoriaUseCase } from './application/listar-auditoria.use-case';
import { AuditoriaRepositoryPg } from './infrastructure/auditoria.repository.pg';
import { AUDITORIA_REPOSITORY } from './domain/auditoria.repository';

// @Global(): RegistrarAuditoriaUseCase se usa desde módulos muy distintos
// (productos, ventas, usuarios, inventario, cupones, cuentas...) — declararlo
// global evita agregar "imports: [AuditoriaModule]" en cada uno de ellos.
@Global()
@Module({
  imports: [PassportModule],
  controllers: [AuditoriaController],
  providers: [
    RegistrarAuditoriaUseCase,
    ListarAuditoriaUseCase,
    { provide: AUDITORIA_REPOSITORY, useClass: AuditoriaRepositoryPg },
  ],
  exports: [RegistrarAuditoriaUseCase],
})
export class AuditoriaModule {}
