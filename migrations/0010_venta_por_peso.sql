-- Permite vender productos por peso (cantidades con decimales, ej. 0.350 kg
-- de frutos secos a granel), además de por unidad entera.

ALTER TABLE productos
  ALTER COLUMN existencias TYPE numeric(10,3) USING existencias::numeric(10,3),
  ALTER COLUMN existencias SET DEFAULT 0,
  ALTER COLUMN stock_minimo TYPE numeric(10,3) USING stock_minimo::numeric(10,3),
  ALTER COLUMN stock_minimo SET DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vende_por_peso boolean NOT NULL DEFAULT false;

ALTER TABLE venta_items
  ALTER COLUMN cantidad TYPE numeric(10,3) USING cantidad::numeric(10,3);

ALTER TABLE movimientos_inventario
  ALTER COLUMN cantidad TYPE numeric(10,3) USING cantidad::numeric(10,3),
  ALTER COLUMN saldo_cantidad TYPE numeric(10,3) USING saldo_cantidad::numeric(10,3);
