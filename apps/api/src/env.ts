export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa tu archivo .env.`);
  }
  return value;
}

export const JWT_SECRET = requireEnv('JWT_SECRET');

// Las fotos de producto se guardan en Cloudinary (almacenamiento permanente)
// en vez del disco del servidor, porque en el plan gratis de Render el disco
// se borra en cada despliegue.
export const CLOUDINARY_CLOUD_NAME = requireEnv('CLOUDINARY_CLOUD_NAME');
export const CLOUDINARY_API_KEY = requireEnv('CLOUDINARY_API_KEY');
export const CLOUDINARY_API_SECRET = requireEnv('CLOUDINARY_API_SECRET');
