-- Guapa Gourmet Market — items de venta y numeración de recibo
-- Permite que una venta tenga productos reales (con descuento de inventario)
-- además del texto libre que ya existía, y le da un número de recibo simple.

CREATE SEQUENCE IF NOT EXISTS ventas_numero_seq START 1;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS numero bigint NOT NULL DEFAULT nextval('ventas_numero_seq');

-- descripcion ahora es opcional: una venta puede tener solo items de producto,
-- solo texto libre, o ambos.
ALTER TABLE ventas
  ALTER COLUMN descripcion DROP NOT NULL;

CREATE TABLE IF NOT EXISTS venta_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id        uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id     uuid NOT NULL REFERENCES productos(id),
  nombre_producto text NOT NULL,
  cantidad        integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12, 2) NOT NULL,
  iva             smallint NOT NULL DEFAULT 0,
  subtotal        numeric(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items (venta_id);
