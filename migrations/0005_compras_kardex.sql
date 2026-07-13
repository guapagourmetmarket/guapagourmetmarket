-- Guapa Gourmet Market — migración 0005
-- Fase 3: proveedores, compras, lotes y kardex (registro inmutable de
-- movimientos de inventario). Cada compra actualiza existencias y el costo
-- promedio ponderado del producto, y deja un rastro en el kardex que nunca
-- se borra ni se edita — anular una compra agrega un movimiento de reversión,
-- no borra el original.

-- ─── Proveedores ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proveedores (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             text NOT NULL,
  nit                text,
  telefono           text,
  email              text,
  direccion          text,
  condiciones_pago   text,
  activo             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores (nombre);

-- ─── Costo y stock mínimo en productos ──────────────────────────────────
-- precio_compra sigue siendo el valor de referencia que la usuaria edita a
-- mano; costo_promedio lo mantiene el sistema solo, recalculado en cada
-- compra (costeo por promedio ponderado).

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS costo_promedio numeric(12, 2),
  ADD COLUMN IF NOT EXISTS stock_minimo integer NOT NULL DEFAULT 0;

-- Punto de partida: el costo promedio arranca igual al precio de compra
-- manual hasta que la primera compra real lo recalcule.
UPDATE productos SET costo_promedio = precio_compra WHERE costo_promedio IS NULL;

-- ─── Compras ─────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS compras_numero_seq START 1;

CREATE TABLE IF NOT EXISTS compras (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                   bigint NOT NULL DEFAULT nextval('compras_numero_seq'),
  proveedor_id             uuid NOT NULL REFERENCES proveedores(id),
  fecha                    date NOT NULL DEFAULT current_date,
  numero_factura_proveedor text,
  subtotal                 numeric(12, 2) NOT NULL DEFAULT 0,
  total                    numeric(12, 2) NOT NULL CHECK (total >= 0),
  metodo_pago              text NOT NULL DEFAULT 'contado' CHECK (
                             metodo_pago IN ('contado', 'transferencia', 'credito')
                           ),
  notas                    text,
  registrado_por           uuid REFERENCES usuarios(id),
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor_id ON compras (proveedor_id);

CREATE TABLE IF NOT EXISTS compra_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id       uuid NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  producto_id     uuid NOT NULL REFERENCES productos(id),
  nombre_producto text NOT NULL,
  cantidad        integer NOT NULL CHECK (cantidad > 0),
  costo_unitario  numeric(12, 2) NOT NULL CHECK (costo_unitario >= 0),
  subtotal        numeric(12, 2) NOT NULL,
  lote            text,
  fecha_vencimiento date
);

CREATE INDEX IF NOT EXISTS idx_compra_items_compra_id ON compra_items (compra_id);

-- ─── Lotes ───────────────────────────────────────────────────────────────
-- cantidad_actual se descuenta a medida que el lote se vende o se ajusta;
-- llegar a 0 no borra el lote (queda como historial de vencimientos).

CREATE TABLE IF NOT EXISTS lotes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id       uuid NOT NULL REFERENCES productos(id),
  compra_item_id    uuid REFERENCES compra_items(id) ON DELETE CASCADE,
  codigo_lote       text,
  fecha_vencimiento date,
  cantidad_inicial  integer NOT NULL CHECK (cantidad_inicial >= 0),
  cantidad_actual   integer NOT NULL CHECK (cantidad_actual >= 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lotes_producto_id ON lotes (producto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_vencimiento ON lotes (fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

-- Si la tabla ya existía de una corrida anterior de esta migración, la
-- restricción no traía ON DELETE CASCADE — se corrige aquí para que anular
-- una compra pueda borrar sus lotes en vez de fallar.
ALTER TABLE lotes DROP CONSTRAINT IF EXISTS lotes_compra_item_id_fkey;
ALTER TABLE lotes ADD CONSTRAINT lotes_compra_item_id_fkey
  FOREIGN KEY (compra_item_id) REFERENCES compra_items(id) ON DELETE CASCADE;

-- ─── Kardex (movimientos de inventario) ────────────────────────────────
-- Registro inmutable: nunca se actualiza ni se borra una fila. Un ajuste o
-- una anulación se registran como un movimiento nuevo, no como edición del
-- anterior. saldo_cantidad guarda las existencias resultantes justo después
-- de este movimiento, para poder reconstruir el kardex de un producto sin
-- tener que sumar todo el historial cada vez.

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id       uuid NOT NULL REFERENCES productos(id),
  tipo              text NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad          integer NOT NULL,
  costo_unitario    numeric(12, 2),
  saldo_cantidad    integer NOT NULL,
  referencia_tipo   text NOT NULL CHECK (
                      referencia_tipo IN ('compra', 'venta', 'ajuste_manual', 'anulacion_compra', 'anulacion_venta')
                    ),
  referencia_id     uuid,
  motivo            text,
  registrado_por    uuid REFERENCES usuarios(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_producto_id ON movimientos_inventario (producto_id, created_at);
