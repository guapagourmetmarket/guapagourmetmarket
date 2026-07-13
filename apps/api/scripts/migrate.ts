import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

async function main() {
  const migrationsDir = join(__dirname, '..', '..', '..', 'migrations');
  const archivos = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    for (const archivo of archivos) {
      const sql = readFileSync(join(migrationsDir, archivo), 'utf-8');
      await client.query(sql);
      console.log(`Migración aplicada: ${archivo}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error aplicando la migración:', err);
  process.exit(1);
});
