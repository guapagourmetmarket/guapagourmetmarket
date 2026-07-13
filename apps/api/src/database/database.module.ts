import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

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
