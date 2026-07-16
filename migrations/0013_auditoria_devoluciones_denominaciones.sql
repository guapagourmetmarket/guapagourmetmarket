-- ─── Auditoría ──────────────────────────────────────────────────────────
-- Registro de quién hizo qué en las acciones sensibles (eliminar, anular,
-- cambiar roles, ajustar inventario, etc.), para poder revisar después.
CREATE TABLE IF NOT EXISTS auditoria (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid REFERENCES usuarios(id),
  accion       text NOT NULL,
  entidad_tipo text NOT NULL,
  entidad_id   uuid,
  detalle      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria (entidad_tipo, entidad_id);

-- ─── Devoluciones ───────────────────────────────────────────────────────
-- Devolver parte de un producto de una venta sin anular el recibo
-- completo. La venta original no se modifica (queda como historial
-- inmutable); `cantidad_devuelta` es solo para saber cuánto queda
-- disponible a devolver de esa línea.
ALTER TABLE venta_items
  ADD COLUMN IF NOT EXISTS cantidad_devuelta numeric(10, 3) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS devoluciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_item_id  uuid NOT NULL REFERENCES venta_items(id),
  cantidad       numeric(10, 3) NOT NULL CHECK (cantidad > 0),
  valor          numeric(12, 2) NOT NULL CHECK (valor >= 0),
  motivo         text,
  registrado_por uuid REFERENCES usuarios(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devoluciones_venta_item ON devoluciones (venta_item_id);

-- El kardex (movimientos_inventario) restringe referencia_tipo a un listado
-- fijo; se agrega 'devolucion' para poder registrar la entrada de stock
-- que genera una devolución, igual que ya se hace con compras/ventas.
ALTER TABLE movimientos_inventario DROP CONSTRAINT IF EXISTS movimientos_inventario_referencia_tipo_check;
ALTER TABLE movimientos_inventario ADD CONSTRAINT movimientos_inventario_referencia_tipo_check
  CHECK (referencia_tipo IN ('compra', 'venta', 'ajuste_manual', 'anulacion_compra', 'anulacion_venta', 'devolucion'));

-- ─── Desglose de denominaciones al cerrar caja ──────────────────────────
-- Conteo físico de billetes y monedas, además del total ya existente.
CREATE TABLE IF NOT EXISTS turno_denominaciones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id     uuid NOT NULL REFERENCES turnos_caja(id) ON DELETE CASCADE,
  denominacion integer NOT NULL CHECK (denominacion > 0),
  cantidad     integer NOT NULL CHECK (cantidad >= 0)
);

CREATE INDEX IF NOT EXISTS idx_turno_denominaciones_turno ON turno_denominaciones (turno_id);
