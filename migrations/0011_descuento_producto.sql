-- Descuento promocional por producto (independiente del descuento por
-- venta ya existente en ventas.descuento). NULL = sin oferta activa.
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS descuento_porcentaje numeric(5,2)
    CHECK (descuento_porcentaje IS NULL OR (descuento_porcentaje > 0 AND descuento_porcentaje <= 100));
