-- Fase 2 (POS): caja y turnos.
-- Permite abrir la caja con un efectivo inicial, ir vendiendo, y cerrarla
-- al final del día con un arqueo (cuánto dice el sistema que debería haber
-- en efectivo vs. cuánto se contó realmente). Solo puede haber un turno
-- abierto a la vez (índice único parcial).

CREATE TABLE IF NOT EXISTS turnos_caja (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        uuid NOT NULL REFERENCES usuarios(id),
  abierto_en        timestamptz NOT NULL DEFAULT now(),
  cerrado_en        timestamptz,
  efectivo_inicial  numeric(12, 2) NOT NULL DEFAULT 0 CHECK (efectivo_inicial >= 0),
  efectivo_esperado numeric(12, 2),
  efectivo_contado  numeric(12, 2),
  diferencia        numeric(12, 2),
  notas             text,
  estado            text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_turno_unico_abierto
  ON turnos_caja ((estado))
  WHERE estado = 'abierto';

CREATE INDEX IF NOT EXISTS idx_turnos_caja_abierto_en ON turnos_caja (abierto_en DESC);

-- Cada venta queda ligada al turno que estaba abierto cuando se registró
-- (si no hay ninguno abierto, queda en null — no se bloquea la venta).
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS turno_id uuid REFERENCES turnos_caja(id);

CREATE INDEX IF NOT EXISTS idx_ventas_turno_id ON ventas (turno_id);
