-- Guapa Gourmet Market — migración 0006
-- Fase 4: contabilidad — gastos manuales y cartera de proveedores (compras
-- a crédito pendientes de pago). El flujo de caja y el estado de resultados
-- se calculan al vuelo a partir de ventas, compras y gastos; no necesitan
-- tablas propias.

CREATE TABLE IF NOT EXISTS gastos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha          date NOT NULL DEFAULT current_date,
  categoria      text NOT NULL,
  descripcion    text,
  valor          numeric(12, 2) NOT NULL CHECK (valor > 0),
  metodo_pago    text NOT NULL DEFAULT 'efectivo' CHECK (
                   metodo_pago IN ('efectivo', 'transferencia', 'tarjeta')
                 ),
  registrado_por uuid REFERENCES usuarios(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos (fecha DESC);

-- ─── Cartera de proveedores ──────────────────────────────────────────────
-- Una compra a crédito nace sin pagar; contado/transferencia nacen pagadas.
-- El backfill de compras existentes solo corre la primera vez: migrate.ts
-- vuelve a aplicar este archivo en cada corrida, y no debe pisar un pago
-- que la usuaria ya haya marcado a mano.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'compras' AND column_name = 'pagado'
  ) THEN
    ALTER TABLE compras ADD COLUMN pagado boolean NOT NULL DEFAULT true;
    UPDATE compras SET pagado = false WHERE metodo_pago = 'credito';
  END IF;
END $$;

ALTER TABLE compras ADD COLUMN IF NOT EXISTS fecha_vencimiento_pago date;

CREATE INDEX IF NOT EXISTS idx_compras_pagado ON compras (pagado) WHERE pagado = false;
