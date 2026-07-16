-- ─── Cupones de descuento ───────────────────────────────────────────────
-- Código que el cajero escribe al cobrar para aplicar un % de descuento a
-- toda la venta (alternativa a escribir el % a mano). El propio código
-- también sirve como "apagador": basta con desactivarlo para que deje de
-- funcionar, sin tener que borrarlo.
CREATE TABLE IF NOT EXISTS cupones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo     text NOT NULL UNIQUE,
  porcentaje numeric(5, 2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Pedidos por encargo ────────────────────────────────────────────────
-- Encargos especiales (ej. tortas para una fecha) que aún no están en el
-- inventario normal. `fecha_entrega` alimenta la alerta de "próximos a
-- entregar" en el menú.
CREATE TABLE IF NOT EXISTS pedidos_encargo (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nombre   text NOT NULL,
  cliente_telefono text,
  descripcion      text NOT NULL,
  fecha_entrega    date NOT NULL,
  valor            numeric(12, 2),
  anticipo         numeric(12, 2) NOT NULL DEFAULT 0 CHECK (anticipo >= 0),
  estado           text NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente', 'entregado', 'cancelado')),
  notas            text,
  registrado_por   uuid REFERENCES usuarios(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_encargo_fecha_entrega ON pedidos_encargo (fecha_entrega ASC);
CREATE INDEX IF NOT EXISTS idx_pedidos_encargo_estado ON pedidos_encargo (estado);

-- ─── Cuentas abiertas ───────────────────────────────────────────────────
-- Una cuenta por cliente dentro de la tienda: se abre con un nombre, se le
-- va agregando lo que va pidiendo, y al cerrarla se convierte en una venta
-- real (mismo historial, kardex y puntos que cualquier otra venta) para no
-- duplicar esa lógica.
CREATE TABLE IF NOT EXISTS cuentas_abiertas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  estado      text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  venta_id    uuid REFERENCES ventas(id),
  abierta_por uuid REFERENCES usuarios(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  cerrada_en  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_cuentas_abiertas_estado ON cuentas_abiertas (estado);

-- Cada línea es un producto del catálogo (con su precio ya resuelto al
-- momento de agregarlo) o, si no está en el catálogo, una descripción
-- libre con su precio — igual de flexible que la venta manual de siempre.
CREATE TABLE IF NOT EXISTS cuenta_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id         uuid NOT NULL REFERENCES cuentas_abiertas(id) ON DELETE CASCADE,
  producto_id       uuid REFERENCES productos(id),
  descripcion_libre text,
  nombre            text NOT NULL,
  cantidad          numeric(10, 3) NOT NULL CHECK (cantidad > 0),
  precio_unitario   numeric(12, 2) NOT NULL CHECK (precio_unitario >= 0),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (producto_id IS NOT NULL OR descripcion_libre IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_cuenta_items_cuenta_id ON cuenta_items (cuenta_id);
