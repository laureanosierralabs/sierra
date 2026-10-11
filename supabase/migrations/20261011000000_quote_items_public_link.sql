-- Ítems de la cotización y link público para el cliente.
--
-- Hasta acá la cotización era un total y el documento se armaba a mano en una
-- plantilla de Drive. Con los ítems cargados, el documento sale del panel:
-- una página pública por cotización que también se imprime como PDF.
--
-- Cuando una cotización tiene ítems, su total es la suma de los ítems y lo
-- mantiene guardarCotizacion. Sin ítems, el total se sigue cargando a mano:
-- las cotizaciones viejas no cambian.

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  position integer not null default 0,
  title text not null check (length(trim(title)) > 0),
  -- Aclaración que va entre paréntesis después del título.
  detail text,
  -- Link opcional sobre el detalle (por ejemplo, la página publicada).
  url text,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  -- Proyecto que cubre este ítem. Lo asignado a cada proyecto en
  -- quote_projects se calcula sumando sus ítems.
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists quote_items_quote_id_idx on quote_items (quote_id, position);

alter table quote_items enable row level security;

-- Token del link público. Null = sin link (o revocado). Es aleatorio y largo:
-- quien no lo tiene no puede adivinarlo, y revocarlo invalida el link viejo.
alter table quotes
  add column if not exists public_token text;

create unique index if not exists quotes_public_token_idx
  on quotes (public_token) where public_token is not null;
