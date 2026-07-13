-- Guapa Gourmet Market — migración 0004
-- Fase 2.5: cierre de catálogo — categorías y marcas normalizadas,
-- ficha nutricional/ingredientes/peso.
--
-- migrate.ts vuelve a aplicar todos los archivos en cada corrida, así que
-- el traspaso de categoria/marca (texto) a tablas propias se envuelve en un
-- bloque condicional: solo corre la primera vez, mientras esas columnas
-- todavía existan.

-- ─── Categorías y marcas ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categorias (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marcas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES categorias(id);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS marca_id uuid REFERENCES marcas(id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'categoria'
  ) THEN
    INSERT INTO categorias (nombre)
    SELECT DISTINCT categoria FROM productos
    WHERE categoria IS NOT NULL AND btrim(categoria) <> ''
    ON CONFLICT (nombre) DO NOTHING;

    INSERT INTO categorias (nombre) VALUES ('Sin categoría') ON CONFLICT (nombre) DO NOTHING;

    UPDATE productos p SET categoria_id = c.id FROM categorias c WHERE c.nombre = p.categoria;
    UPDATE productos SET categoria_id = (SELECT id FROM categorias WHERE nombre = 'Sin categoría')
      WHERE categoria_id IS NULL;

    ALTER TABLE productos ALTER COLUMN categoria_id SET NOT NULL;
    ALTER TABLE productos DROP COLUMN categoria;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'marca'
  ) THEN
    INSERT INTO marcas (nombre)
    SELECT DISTINCT marca FROM productos
    WHERE marca IS NOT NULL AND btrim(marca) <> ''
    ON CONFLICT (nombre) DO NOTHING;

    UPDATE productos p SET marca_id = m.id FROM marcas m WHERE m.nombre = p.marca;

    ALTER TABLE productos DROP COLUMN marca;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON productos (marca_id);

-- ─── Ficha nutricional ───────────────────────────────────────────────────

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS ingredientes text,
  ADD COLUMN IF NOT EXISTS info_nutricional jsonb,
  ADD COLUMN IF NOT EXISTS peso numeric(12, 2),
  ADD COLUMN IF NOT EXISTS peso_unidad text;
