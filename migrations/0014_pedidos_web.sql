-- ─── Pedidos web (pre-pedidos desde la tienda pública) ──────────────────
-- Un cliente arma un carrito en /tienda y lo envía sin pagar en línea: el
-- pago se coordina directo con quien despacha (efectivo, transferencia,
-- Nequi, Bold, lo que sea). Por eso NO descuenta inventario ni genera
-- kardex — es solo una solicitud; se vuelve una venta real aparte cuando
-- se despache.
CREATE SEQUENCE IF NOT EXISTS pedidos_web_numero_seq START 1;

CREATE TABLE IF NOT EXISTS pedidos_web (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero           bigint NOT NULL DEFAULT nextval('pedidos_web_numero_seq'),
  cliente_nombre   text NOT NULL,
  cliente_telefono text NOT NULL,
  notas            text,
  valor            numeric(12, 2) NOT NULL,
  estado           text NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente', 'confirmado', 'despachado', 'cancelado')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_web_estado ON pedidos_web (estado);

-- Precio y nombre quedan copiados al momento del pedido (igual que
-- venta_items): si el producto cambia de precio o se borra después, el
-- pedido histórico no se altera.
CREATE TABLE IF NOT EXISTS pedido_web_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_web_id   uuid NOT NULL REFERENCES pedidos_web(id) ON DELETE CASCADE,
  producto_id     uuid REFERENCES productos(id),
  nombre_producto text NOT NULL,
  cantidad        numeric(10, 3) NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12, 2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal        numeric(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pedido_web_items_pedido_id ON pedido_web_items (pedido_web_id);
