import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Client } from 'pg';

async function main() {
  const [, , email, nuevaClave] = process.argv;
  if (!email || !nuevaClave) {
    console.error('Uso: npm run set-password -- correo@ejemplo.com nueva-clave');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const hash = await bcrypt.hash(nuevaClave, 10);
    const { rowCount } = await client.query(
      `UPDATE usuarios SET password_hash = $1, updated_at = now() WHERE email = $2`,
      [hash, email],
    );
    if (rowCount === 0) {
      console.error(`No existe ningún usuario con el correo ${email}.`);
      process.exit(1);
    }
    console.log(`Contraseña actualizada para ${email}.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error actualizando la contraseña:', err);
  process.exit(1);
});
