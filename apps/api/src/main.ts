import './load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './uploads-path';
import { HttpExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(
    helmet({
      // Las imágenes de producto se sirven desde /uploads en el mismo origen
      // de la API, no desde un CDN; CORP por defecto ('same-origin') bloquearía
      // que la web (otro puerto/origen) las cargue en <img>.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const origenesFijos = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim());
  // Las IP de redes privadas (casa/tienda) cambian solas al reconectar el WiFi.
  // En vez de mantener la IP a mano en WEB_ORIGIN, se acepta cualquier origen
  // que sea una IP privada (192.168.x.x, 10.x.x.x, 172.16-31.x.x) en el puerto
  // 5173, además de los orígenes fijos (localhost y los de producción).
  const esRedPrivada = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):5173$/;
  app.enableCors({
    origin: (origen, callback) => {
      if (!origen || origenesFijos.includes(origen) || esRedPrivada.test(origen)) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS.'));
      }
    },
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
