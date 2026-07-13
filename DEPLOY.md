# Guía para poner Guapa Gourmet Market en internet

Hay dos planes. Por ahora vamos con el **Plan gratis** (sin dominio propio,
sin tarjeta). Dejo también el plan con dominio propio más abajo, para cuando
quieran dar ese paso.

## Plan gratis (el que vamos a usar ahora)

Tres cuentas gratis, sin dominio propio — el link va a ser algo como
`guapa-gourmet.vercel.app`.

### 1. Base de datos — Neon (Postgres gratis)

1. Entra a [neon.tech](https://neon.tech) y crea cuenta (con Google o GitHub,
   sin tarjeta).
2. Crea un proyecto nuevo, cualquier nombre (ej. `guapa-gourmet`).
3. Copia el **Connection string** que te dan (empieza con `postgresql://...`)
   — esa va a ser la `DATABASE_URL` de producción. Guárdalo, lo vamos a
   necesitar.

### 2. API — Render (plan gratis)

1. Entra a [render.com](https://render.com) y crea cuenta (con GitHub, sin
   tarjeta para el plan gratis).
2. "New" → "Web Service" → conecta este repositorio.
3. Configura:
   - Root directory: `apps/api`
   - Runtime: Docker (Render detecta el `Dockerfile` que ya está listo)
   - Instance type: **Free**
4. Variables de entorno a configurar en Render:
   - `DATABASE_URL` → el connection string de Neon del paso anterior
   - `JWT_SECRET` → un valor largo y aleatorio (te genero uno cuando lleguemos aquí)
   - `WEB_ORIGIN` → la URL que te dé Vercel en el siguiente paso (se agrega
     después, o se deja `http://localhost:5173` por ahora y se actualiza luego)
   - `DATABASE_SSL` → `true`
5. Nota sobre el plan gratis de Render: el servicio "se duerme" tras ~15 min
   sin uso, y tarda 30-60 segundos en despertar la primera vez que alguien
   entra después de eso. Normal y esperado en el plan gratis.
6. Corre las migraciones una vez contra Neon: desde tu computador,
   ```
   cd apps/api
   DATABASE_URL="el-connection-string-de-neon" npm run migrate
   DATABASE_URL="el-connection-string-de-neon" npm run seed
   ```

### 3. Web — Vercel (gratis)

1. Entra a [vercel.com](https://vercel.com) y crea cuenta (con GitHub, sin tarjeta).
2. Importa este repositorio, configurando:
   - Root directory: `apps/web`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Variable de entorno: `VITE_API_URL` → la URL que te dé Render (algo como
     `https://guapa-api.onrender.com`)
3. Vercel te da un link gratis tipo `guapa-gourmet-market.vercel.app` — ese es
   el que puedes compartir.
4. Vuelve a Render y actualiza `WEB_ORIGIN` con ese link de Vercel (para que la
   API acepte peticiones desde ahí).

### Nota sobre las fotos de productos

En el plan gratis, las fotos que se suban quedan guardadas en el disco del
servicio de Render, que **se puede perder si el servicio se redespliega**. No
es grave para probar; si más adelante quieren que las fotos queden 100%
seguras, lo resolvemos moviendo el guardado a un servicio de almacenamiento
(hay opciones gratis también, como Cloudflare R2).

### Cuando tengas las 3 cuentas creadas

Dime y seguimos juntos, paso a paso, llenando cada variable de entorno y
probando que todo conecte bien en vivo.

---

## Plan con dominio propio (para más adelante)

Cuando quieran www.guapagourmetmarket.com de verdad, sin que la API se
duerma, el cambio es:

1. Comprar el dominio en [Namecheap](https://www.namecheap.com) o
   [GoDaddy](https://www.godaddy.com) (~10-15 USD/año).
2. Cambiar Render (gratis) por **Railway** (railway.app, ~5-20 USD/mes) para
   que la API no se duerma y las fotos queden en un disco persistente.
3. Conectar el dominio comprado a Vercel (web) y a Railway (API) — cada uno
   da instrucciones exactas de DNS al agregar un dominio personalizado.

## Qué ya está listo en el código

- `apps/api/Dockerfile` — construye la API para producción.
- `apps/api/.env.example` — lista de variables de entorno necesarias.
- `apps/api/scripts/backup.sh` / `restore.sh` — respaldos de la base de datos.
- CORS configurado para aceptar múltiples orígenes (local + producción).
