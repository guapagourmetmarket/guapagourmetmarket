ALTER TABLE ventas ADD COLUMN IF NOT EXISTS descuento numeric(12,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0);
