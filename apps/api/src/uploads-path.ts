import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

export const UPLOADS_DIR = join(__dirname, '..', 'uploads');
export const PRODUCTOS_UPLOADS_DIR = join(UPLOADS_DIR, 'productos');

mkdirSync(PRODUCTOS_UPLOADS_DIR, { recursive: true });
