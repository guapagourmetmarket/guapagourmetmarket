import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductosModule } from './modules/productos/productos.module';
import { NegocioModule } from './modules/negocio/negocio.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ComprasModule } from './modules/compras/compras.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { CajaModule } from './modules/caja/caja.module';
import { CuponesModule } from './modules/cupones/cupones.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { CuentasModule } from './modules/cuentas/cuentas.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    AuditoriaModule,
    AuthModule,
    ProductosModule,
    NegocioModule,
    VentasModule,
    ComprasModule,
    InventarioModule,
    ContabilidadModule,
    ClientesModule,
    ReportesModule,
    CajaModule,
    CuponesModule,
    PedidosModule,
    CuentasModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
