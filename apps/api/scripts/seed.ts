import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Client } from 'pg';
import { productosSeed } from './productos.seed.data';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const { rows: usuariosExistentes } = await client.query('SELECT id FROM usuarios LIMIT 1');
    if (usuariosExistentes.length === 0) {
      const claveProvisional = randomBytes(6).toString('base64url');
      const hash = await bcrypt.hash(claveProvisional, 10);
      await client.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'administrador')`,
        ['Paola Rodríguez', 'paola@guapagourmet.com', hash],
      );
      console.log('Usuaria administradora creada:');
      console.log('  email: paola@guapagourmet.com');
      console.log(`  clave: ${claveProvisional}`);
      console.log('  (Guárdala; se puede cambiar luego desde la app.)');
    } else {
      console.log('Ya existe al menos un usuario; no se crea de nuevo.');
    }

    const { rows: productosExistentes } = await client.query('SELECT id FROM productos LIMIT 1');
    if (productosExistentes.length === 0) {
      for (const p of productosSeed) {
        const { rows: catRows } = await client.query(
          `INSERT INTO categorias (nombre) VALUES ($1)
           ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
          [p.categoria],
        );
        const { rows: marcaRows } = await client.query(
          `INSERT INTO marcas (nombre) VALUES ($1)
           ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
          [p.marca],
        );
        await client.query(
          `INSERT INTO productos
            (codigo_interno, codigo_barras, nombre, descripcion, precio_compra, precio_venta,
             iva, categoria_id, marca_id, unidad_medida, existencias, favorito_pos)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            p.codigoInterno,
            p.codigoBarras,
            p.nombre,
            p.descripcion,
            p.precioCompra,
            p.precioVenta,
            p.iva,
            catRows[0].id,
            marcaRows[0].id,
            p.unidadMedida,
            p.existencias,
            p.favoritoPos,
          ],
        );
      }
      console.log(`${productosSeed.length} productos de ejemplo insertados.`);
    } else {
      console.log('Ya existen productos; no se insertan de nuevo.');
    }

    const { rows: negocioExistente } = await client.query('SELECT id FROM negocio LIMIT 1');
    if (negocioExistente.length === 0) {
      await client.query(
        `INSERT INTO negocio (nombre, nit, direccion, telefono) VALUES ($1, $2, $3, $4)`,
        [
          'Guapa Gourmet Market',
          '53074700-8',
          'Calle 1 4-09, Barrio Las Villas, Mosquera, Cundinamarca',
          '3174047796',
        ],
      );
      console.log('Datos del negocio guardados (nombre, NIT, dirección, teléfono).');
    } else {
      console.log('Ya existen datos del negocio; no se sobrescriben.');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error sembrando datos:', err);
  process.exit(1);
});
