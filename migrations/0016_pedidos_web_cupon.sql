-- ─── Cupón de descuento en pre-pedidos web ───────────────────────────────
-- La tienda pública no tenía forma de aplicar un cupón (ese input solo
-- existía en el POS interno). "valor" pasa a ser el total YA con el
-- descuento aplicado (igual que en ventas): "descuento" queda aparte para
-- mostrarlo desglosado, y "cupon_codigo" guarda cuál se usó.
ALTER TABLE pedidos_web ADD COLUMN IF NOT EXISTS descuento numeric(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE pedidos_web ADD COLUMN IF NOT EXISTS cupon_codigo text;
