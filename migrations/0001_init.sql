-- Guapa Gourmet Market — migración inicial
-- Núcleo de Fase 1: usuarios (auth) y catálogo de productos con búsqueda inteligente.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- unaccent() no está marcada IMMUTABLE por Postgres (depende del diccionario
-- de búsqueda), así que no se puede usar directo en un índice. Esta versión
-- fija el diccionario y se declara IMMUTABLE para poder indexarla.
CREATE OR REPLACE FUNCTION unaccent_inmutable(text)
  RETURNS text AS $$
    SELECT unaccent('unaccent'::regdictionary, $1)
  $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- ─── Usuarios ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuarios (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  rol           text NOT NULL CHECK (rol IN ('administrador', 'cajero', 'contador', 'supervisor')),
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Productos ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS productos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_interno text NOT NULL UNIQUE,
  codigo_barras  text UNIQUE,
  nombre         text NOT NULL,
  descripcion    text,
  precio_compra  numeric(12, 2) NOT NULL DEFAULT 0,
  precio_venta   numeric(12, 2) NOT NULL DEFAULT 0,
  iva            smallint NOT NULL DEFAULT 0 CHECK (iva IN (0, 5, 19)),
  categoria      text NOT NULL,
  marca          text,
  unidad_medida  text NOT NULL DEFAULT 'unidad',
  existencias    integer NOT NULL DEFAULT 0,
  favorito_pos   boolean NOT NULL DEFAULT false,
  activo         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Varias fotos por producto. Las ventas (fase 2) copian nombre/precio y no
-- referencian esta tabla, así que cambiar la foto nunca afecta el historial.
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url          text NOT NULL,
  es_principal boolean NOT NULL DEFAULT false,
  orden        integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Búsqueda inteligente en tiempo real: por nombre (insensible a acentos y
-- tolerante a errores de tipeo vía trigramas), código interno y de barras.
CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
  ON productos USING gin (unaccent_inmutable(nombre) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_interno ON productos (codigo_interno);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos (codigo_barras);
CREATE INDEX IF NOT EXISTS idx_producto_imagenes_producto_id ON producto_imagenes (producto_id);
