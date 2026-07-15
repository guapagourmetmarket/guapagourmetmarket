import { Global, Module } from '@nestjs/common';
import { Pool, types } from 'pg';

export const PG_POOL = 'PG_POOL';

// El driver pg devuelve NUMERIC/DECIMAL como string por defecto (para no
// perder precisión con floats). La app ya trata esas columnas como number
// en todo el código (existencias, precios, cantidades); parsearlas acá, una
// sola vez, evita tener que envolver cada lectura con Number(...) y evita
// bugs si algún lugar nuevo se olvida de hacerlo.
types.setTypeParser(types.builtins.NUMERIC, (val) => (val === null ? null : parseFloat(val)));

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL,
          // Postgres local (docker-compose) no usa TLS; en producción contra un
          // proveedor administrado se activa con DATABASE_SSL=true.
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
          max: Number(process.env.DATABASE_POOL_MAX) || 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 10_000,
        }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
