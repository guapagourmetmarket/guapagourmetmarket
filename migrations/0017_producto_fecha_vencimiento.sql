-- ─── Fecha de vencimiento directa en el producto ─────────────────────────
-- Hasta ahora el vencimiento solo se registraba por lote, al recibir una
-- compra. Para productos que no pasan por ese flujo (o mientras se carga
-- el inventario inicial), esta fecha permite que el mismo producto
-- aparezca en "Alertas" sin necesidad de un lote.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fecha_vencimiento date;
