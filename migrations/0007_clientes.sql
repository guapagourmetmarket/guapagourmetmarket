-- Guapa Gourmet Market — migración 0007
-- Fase 5: clientes, fidelización por puntos y ventas fiadas (crédito a
-- clientes de confianza). Los puntos siguen el mismo patrón que el kardex
-- de inventario: un saldo en cliente.puntos para lectura rápida, respaldado
-- por un ledger inmutable (movimientos_puntos) que nunca se edita ni se borra.

CREATE TABLE IF NOT EXISTS clientes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            text NOT NULL,
  telefono          text,
  email             text,
  direccion         text,
  fecha_nacimiento  date,
  puntos            integer NOT NULL DEFAULT 0,
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_cumpleanos
  ON clientes (EXTRACT(month FROM fecha_nacimiento), EXTRACT(day FROM fecha_nacimiento))
  WHERE fecha_nacimiento IS NOT NULL;

CREATE TABLE IF NOT EXISTS movimientos_puntos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid NOT NULL REFERENCES clientes(id),
  tipo            text NOT NULL CHECK (tipo IN ('acumulado', 'canjeado', 'ajuste')),
  puntos          integer NOT NULL,
  saldo_puntos    integer NOT NULL,
  referencia_tipo text NOT NULL CHECK (referencia_tipo IN ('venta', 'canje', 'ajuste_manual')),
  referencia_id   uuid,
  motivo          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_puntos_cliente_id ON movimientos_puntos (cliente_id, created_at);

-- ─── Ventas fiadas ───────────────────────────────────────────────────────
-- cliente_id vincula la venta a un cliente registrado (además del texto
-- libre cliente_nombre que ya existía, para ventas de mostrador sin
-- registrar). pagado sigue el mismo patrón que compras: nace en true salvo
-- que sea fiado.

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id),
  ADD COLUMN IF NOT EXISTS pagado boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento_pago date;

CREATE INDEX IF NOT EXISTS idx_ventas_pagado ON ventas (pagado) WHERE pagado = false;
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas (cliente_id);
