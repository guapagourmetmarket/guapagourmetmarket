import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NegocioController } from './interface/negocio.controller';
import { ObtenerNegocioUseCase } from './application/obtener-negocio.use-case';
import { ActualizarNegocioUseCase } from './application/actualizar-negocio.use-case';
import { NegocioRepositoryPg } from './infrastructure/negocio.repository.pg';
import { NEGOCIO_REPOSITORY } from './domain/negocio.repository';

@Module({
  imports: [PassportModule],
  controllers: [NegocioController],
  providers: [
    ObtenerNegocioUseCase,
    ActualizarNegocioUseCase,
    { provide: NEGOCIO_REPOSITORY, useClass: NegocioRepositoryPg },
  ],
})
export class NegocioModule {}
