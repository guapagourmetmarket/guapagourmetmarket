import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { VentasModule } from '../ventas/ventas.module';
import { CuentasController } from './interface/cuentas.controller';
import { ListarCuentasUseCase } from './application/listar-cuentas.use-case';
import { AbrirCuentaUseCase } from './application/abrir-cuenta.use-case';
import { AgregarItemCuentaUseCase } from './application/agregar-item-cuenta.use-case';
import { QuitarItemCuentaUseCase } from './application/quitar-item-cuenta.use-case';
import { CerrarCuentaUseCase } from './application/cerrar-cuenta.use-case';
import { CancelarCuentaUseCase } from './application/cancelar-cuenta.use-case';
import { CuentasRepositoryPg } from './infrastructure/cuentas.repository.pg';
import { CUENTAS_REPOSITORY } from './domain/cuentas.repository';

@Module({
  imports: [PassportModule, VentasModule],
  controllers: [CuentasController],
  providers: [
    ListarCuentasUseCase,
    AbrirCuentaUseCase,
    AgregarItemCuentaUseCase,
    QuitarItemCuentaUseCase,
    CerrarCuentaUseCase,
    CancelarCuentaUseCase,
    { provide: CUENTAS_REPOSITORY, useClass: CuentasRepositoryPg },
  ],
})
export class CuentasModule {}
