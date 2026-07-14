import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CajaController } from './interface/caja.controller';
import { ObtenerTurnoAbiertoUseCase } from './application/obtener-turno-abierto.use-case';
import { AbrirCajaUseCase } from './application/abrir-caja.use-case';
import { CerrarCajaUseCase } from './application/cerrar-caja.use-case';
import { ListarTurnosUseCase } from './application/listar-turnos.use-case';
import { CajaRepositoryPg } from './infrastructure/caja.repository.pg';
import { CAJA_REPOSITORY } from './domain/caja.repository';

@Module({
  imports: [PassportModule],
  controllers: [CajaController],
  providers: [
    ObtenerTurnoAbiertoUseCase,
    AbrirCajaUseCase,
    CerrarCajaUseCase,
    ListarTurnosUseCase,
    { provide: CAJA_REPOSITORY, useClass: CajaRepositoryPg },
  ],
})
export class CajaModule {}
