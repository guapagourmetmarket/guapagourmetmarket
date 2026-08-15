-- Permite que una línea de venta no esté ligada a un producto del catálogo,
-- para cuando el cajero necesita agregar algo con solo nombre y precio
-- (producto que todavía no se ha cargado formalmente) sin hacer esperar al
-- cliente. Mismo patrón que ya usa pedido_web_items.producto_id.
ALTER TABLE venta_items ALTER COLUMN producto_id DROP NOT NULL;
