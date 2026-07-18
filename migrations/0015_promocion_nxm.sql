-- ─── Promoción "lleva N, paga M" (2x1, 3x2, etc.) ────────────────────────
-- Segunda forma de oferta, aparte del % de descuento que ya existía. Un
-- producto solo puede tener activa una de las dos a la vez.
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS promocion_n integer,
  ADD COLUMN IF NOT EXISTS promocion_m integer;

ALTER TABLE productos
  DROP CONSTRAINT IF EXISTS chk_promocion_nxm_pareja,
  ADD CONSTRAINT chk_promocion_nxm_pareja
    CHECK ((promocion_n IS NULL) = (promocion_m IS NULL));

ALTER TABLE productos
  DROP CONSTRAINT IF EXISTS chk_promocion_nxm_valores,
  ADD CONSTRAINT chk_promocion_nxm_valores
    CHECK (promocion_n IS NULL OR (promocion_n >= 2 AND promocion_m >= 1 AND promocion_m < promocion_n));

ALTER TABLE productos
  DROP CONSTRAINT IF EXISTS chk_promocion_exclusiva,
  ADD CONSTRAINT chk_promocion_exclusiva
    CHECK (NOT (descuento_porcentaje IS NOT NULL AND promocion_n IS NOT NULL));
