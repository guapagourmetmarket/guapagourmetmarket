# Guapa Gourmet Market — Sistema de gestión integral

> Este archivo es el **contexto maestro** del proyecto. Léelo completo antes de escribir código. Trabajamos **fase por fase**: no construyas todo de una vez, y **pregunta antes de avanzar** cuando falte información.

## 1. Qué estamos construyendo

Software profesional para administrar una **tienda de productos saludables** (inventario, POS, contabilidad, clientes, proveedores, reportes e IA). Debe ser rápido, escalable y con imagen de marca desde el día uno.

- **Alcance:** un solo negocio (single-tenant), pero con soporte de **varias sucursales y varias cajas**.
- **Prioridad crítica:** el **POS funciona sin internet (offline-first)** y sincroniza al reconectar.
- **Facturación electrónica DIAN:** no se implementa aún, pero el modelo de datos ya reserva los campos (`dian_cufe`, `dian_resolucion`) y la numeración por rangos de caja para habilitarla sin reescribir (Fase 8).

## 2. Stack

- **Frontend:** React + TypeScript (Vite), como **PWA** instalable en Windows, Mac, iPad, Android e iPhone. Estado servidor con TanStack Query.
- **Base local offline:** IndexedDB vía Dexie + patrón *outbox* para la cola de sincronización.
- **Backend:** Node.js + **NestJS** (TypeScript), Clean Architecture y principios SOLID.
- **Base de datos:** PostgreSQL 15+. Caché con Redis.
- **Infra:** Docker Compose (Postgres + Redis) en desarrollo. Imágenes de producto en almacenamiento de objetos (S3/R2).

## 3. Estructura del repositorio (monorepo)

```
guapa-gourmet-market/
├─ apps/
│  ├─ api/                      # NestJS
│  │  └─ src/modules/{auth,usuarios,productos,inventario,pos,
│  │                    compras,clientes,contabilidad,reportes}
│  │     └─ <modulo>/{domain,application,infrastructure,interface}
│  └─ web/                      # PWA React
│     └─ src/
│        ├─ features/           # pos, productos, inventario, dashboards...
│        ├─ components/         # design system (Button, Card, Table, Modal...)
│        ├─ theme/theme.ts      # tokens: colores y logo (fuente única)
│        └─ lib/{api,sync,db}   # cliente API, sincronización, base local
│           └─ public/brand/    # logo.svg (reemplazable)
├─ packages/shared/             # tipos y DTOs compartidos front/back
├─ migrations/0001_init.sql
├─ docker-compose.yml
└─ CLAUDE.md
```

Cada módulo del backend sigue **Clean Architecture**: `domain` (entidades y reglas), `application` (casos de uso), `infrastructure` (repositorios, DB), `interface` (controladores/DTOs). Sin dependencias que apunten hacia afuera del dominio.

## 4. Identidad visual y Design System

El sistema debe reflejar la marca **Guapa Gourmet Market** desde el inicio.

- **Logo oficial:** incluido en `public/brand/logo-guapa.png` (y `@2x` para retina). Es un círculo con verde salvia, aro rosa empolvado y texto crema. Todo el uso del logo lee de `theme.ts` para poder reemplazarlo en un solo lugar.
- **Autoría:** mostrar **"by Paola Rodríguez"** (creadora de la marca) en el encabezado y en la pantalla de login / acerca de.
- **Paleta oficial** (tomada del logo; pastel, natural, **sin colores saturados**). Protagonista **verde salvia**, acento cálido **rosa empolvado**. Definida en `theme.ts`:
  - salvia del logo `#9AAD9C`, salvia fuerte `#5F7A64`, rosa empolvado `#E2C1BC`, crema `#FAF5EC`, beige `#EFE7D8`, tinta `#2E332C`.
- **Estilo:** moderno, elegante, minimalista, agradable a la vista. Mucho espacio en blanco, esquinas redondeadas suaves, sombras muy tenues.
- **Tipografía:** display `Poppins` (marca/titulares, geométrica acorde al logo), UI `Inter`. Precios y cantidades con cifras tabulares.
- **UX:** navegación sencilla, botones claros con etiquetas de acción ("Cobrar", "Guardar producto"), iconografía moderna (lucide), curva de aprendizaje mínima para cualquier persona.
- **Tema intercambiable:** colores y logo se cambian editando solo `theme.ts` (`applyBrand()` los publica como variables CSS). Dejarlo listo para una futura actualización de identidad.
- **Multiplataforma (requisito):** debe correr en **Mac, Windows, iPhone y iPad**. Al ser PWA, se instala como app en los cuatro desde el navegador (Safari en iPhone/iPad/Mac; Chrome/Edge en Windows/Mac) sin publicar en tiendas. **Responsive completo**: debe verse y funcionar bien en computador, iPad y celular, con `manifest.webmanifest` e íconos de la marca.
- **Cuando llegue el logo:** generar un **manual de Design System** (tipografía, colores oficiales, botones, tarjetas, tablas, formularios, iconos, menús y pantallas del POS) para garantizar consistencia profesional.

## 5. Módulos y especificaciones

### Gestión de productos (fácil e intuitiva)
- Agregar, editar o eliminar un producto toma pocos segundos, con un formulario claro.
- Cada producto admite **una o varias fotografías** de buena calidad; la **imagen principal** se muestra automáticamente al escanear o buscar.
- Cambiar la foto en cualquier momento **no afecta el historial de ventas** (las líneas de venta copian nombre/precio; no referencian imágenes).
- Si un producto no tiene imagen, mostrar un **ícono por defecto**.
- **Importar** productos desde Excel/CSV (con imágenes cuando sea posible) para la carga inicial; **exportar** el inventario a Excel o PDF.
- Campos por producto: código interno, código de barras, nombre, descripción, precio de compra, precio de venta, IVA (0/5/19%), categoría, marca, unidad de medida, existencias, imagen.

### Búsqueda inteligente
- Encontrar productos por código de barras, código interno, nombre, marca, categoría y palabras clave.
- Resultados en **tiempo real** mientras se escribe o escanea, mostrando **foto, precio y disponibilidad**. (Índices `pg_trgm` + `unaccent` ya creados en la migración.)

### Punto de venta (POS)
- Muy rápido. Buscar por nombre/código, **escanear código de barras** (lector USB = teclado + Enter; también cámara del celular).
- Al escanear un producto, mostrar de inmediato: **foto, nombre, precio, cantidad disponible y alertas** (próximo a vencer, poco inventario).
- **Modo táctil:** botones grandes con imágenes de los **productos más vendidos / favoritos** (`producto.favorito_pos`), para vender tocando la pantalla en iPad además de escanear. Útil cuando un código no lee bien.
- Carrito: cambiar cantidades, aplicar descuentos, clientes frecuentes.
- Pagos: efectivo, tarjeta, transferencia, **Nequi**, **Daviplata** y **mixto**. Cálculo automático de subtotal, IVA, total y cambio.
- Caja: abrir, cerrar, arqueo, historial de ventas, reimpresión de factura.
- **Offline-first:** la venta se escribe en la base local y se encola (outbox); al reconectar sincroniza. La numeración usa el rango de la caja (`caja_terminal`) para no depender del servidor.

### Otros módulos (fases posteriores)
- **Inventario:** kardex (log inmutable), entradas/salidas, ajustes, control por lote y vencimiento, costo promedio y FIFO, inventario valorizado, inventario mínimo y alertas.
- **Compras y proveedores:** órdenes de compra, recepción, cuentas por pagar.
- **Contabilidad:** ingresos, gastos, cuentas por cobrar/pagar, flujo de caja, libro diario/mayor, estado de resultados, balance.
- **Clientes:** historial, cumpleaños, puntos, fidelización, cartera y créditos.
- **Reportes:** dashboards con **gráficos limpios y fáciles de interpretar**, con la identidad de marca (ventas del día/mes, más y menos vendidos, margen, rotación, productos por vencer, ventas por categoría/empleado, flujo de caja).
- **Usuarios y roles:** administrador, cajero, contador, supervisor; permisos por módulo.
- **IA:** consultas en lenguaje natural ("¿cuánto vendí este mes?") con capa texto→SQL; recomendación de compras, baja rotación y alertas de vencimiento.

## 6. Base de datos

El esquema del núcleo está en `migrations/0001_init.sql` (productos + imágenes, búsqueda, kardex, ventas offline, clientes, compras). Las tablas de contabilidad, fidelización, reportes y DIAN se agregan en migraciones posteriores, según la fase.

## 7. Plan por fases

0. Análisis y diseño ✔ (hecho)
1. **Núcleo:** autenticación, usuarios/roles, catálogo de productos (con fotos, import/export) y búsqueda inteligente.
2. **POS + caja + facturación** (con modo táctil y offline).
3. Compras, proveedores, kardex y costeo (promedio/FIFO).
4. Contabilidad.
5. Clientes y fidelización.
6. Reportes y dashboards.
7. IA.
8. DIAN, multi-sucursal avanzado y endurecimiento (seguridad, rendimiento, backups).

## 8. Forma de trabajo

1. Empieza por la **Fase 1**. Antes de codificar cada módulo, propón brevemente su diseño (endpoints, entidades, componentes) y espera confirmación.
2. Escribe **código limpio, documentado y con pruebas**; sigue SOLID y Clean Architecture.
3. **Pregunta** cuando falte información en lugar de asumir.
4. Toda pantalla debe cumplir el **piso de calidad**: responsive (computador/iPad/celular), foco de teclado visible, estados de carga/vacío/error claros, y respetar la identidad de `theme.ts`.
5. No introduzcas dependencias pesadas sin justificarlas.

## 9. Primer paso sugerido

Levantar el andamiaje: monorepo, `docker-compose` (Postgres + Redis), NestJS con el módulo `auth` (login + roles) y la PWA con el design system base (`theme.ts`, componentes `Button`, `Card`, `Input`, `Modal`) y la pantalla de login con el logo. Luego, el módulo de **productos** con su formulario, fotos y búsqueda.
