import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from '../../../env';

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

/** Sube una foto de producto a Cloudinary (almacenamiento permanente) y devuelve su URL pública. */
export function subirImagenProductoACloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'guapa-gourmet/productos' },
      (error, resultado) => {
        if (error || !resultado) {
          reject(error ?? new Error('Cloudinary no devolvió resultado.'));
          return;
        }
        resolve(resultado.secure_url);
      },
    );
    stream.end(buffer);
  });
}
