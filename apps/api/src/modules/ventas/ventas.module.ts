import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { VentasController } from './interface/ventas.controller';
import { ListarVentasUseCase } from './application/listar-ventas.use-case';
import { RegistrarVentaUseCase } from './application/registrar-venta.use-case';
import { AnularVentaUseCase } from './application/anular-venta.use-case';
import { ListarCarteraClientesUseCase } from './application/listar-cartera-clientes.use-case';
import { MarcarVentaPagadaUseCase } from './application/marcar-venta-pagada.use-case';
import { VentasRepositoryPg } from './infrastructure/ventas.repository.pg';
import { VENTAS_REPOSITORY } from './domain/ventas.repository';

@Module({
  imports: [PassportModule],
  controllers: [VentasController],
  providers: [
    ListarVentasUseCase,
    RegistrarVentaUseCase,
    AnularVentaUseCase,
    ListarCarteraClientesUseCase,
    MarcarVentaPagadaUseCase,
    { provide: VENTAS_REPOSITORY, useClass: VentasRepositoryPg },
  ],
  // Cuentas abiertas reusa este caso de uso para "cerrar" una cuenta como
  // una venta real (mismo historial, kardex y puntos), en vez de duplicar
  // esa lógica de transacción.
  exports: [RegistrarVentaUseCase],
})
export class VentasModule {}
