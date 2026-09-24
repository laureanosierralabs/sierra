-- Ajustes sueltos de la unidad (clave/valor). Hoy: la plantilla editable de
-- cotizaciones; mañana, lo que haga falta sin migrar de nuevo.

create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- Vincula la cotización con el movimiento que se registró en finanzas.
alter table quotes
  add column if not exists movement_id text;

alter table settings enable row level security;
