-- Guapa Gourmet Market — datos del negocio y venta manual
-- Ampliación de Fase 1: configuración del negocio (NIT, dirección) y un
-- registro manual de ventas mientras se termina de cargar el inventario.

-- ─── Datos del negocio ──────────────────────────────────────────────────
-- Una sola fila con los datos que aparecen en ventas/recibos. Se siembra
-- directo en la base de datos (sin pantalla de edición todavía).

CREATE TABLE IF NOT EXISTS negocio (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  nit        text NOT NULL,
  direccion  text,
  telefono   text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Ventas ─────────────────────────────────────────────────────────────
-- Registro simple (fecha, cliente opcional, descripción libre, valor,
-- método de pago). `origen` distingue una venta cargada a mano de una
-- venta de caja (POS, Fase 2), para que ambas compartan el mismo
-- historial sin necesidad de migrar datos después. `dian_cufe` y
-- `dian_resolucion` quedan reservados y vacíos hasta activar DIAN (Fase 8).

CREATE TABLE IF NOT EXISTS ventas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha           date NOT NULL DEFAULT current_date,
  cliente_nombre  text,
  descripcion     text NOT NULL,
  valor           numeric(12, 2) NOT NULL CHECK (valor >= 0),
  metodo_pago     text NOT NULL CHECK (
                     metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'nequi', 'daviplata', 'mixto')
                   ),
  origen          text NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual', 'pos')),
  dian_cufe       text,
  dian_resolucion text,
  registrado_por  uuid REFERENCES usuarios(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha DESC);
