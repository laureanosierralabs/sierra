-- Landing Pages V1 — clientes, cotizaciones y sus relaciones con projects.
-- Aditiva: no toca la migración anterior ni los datos existentes.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  instagram text,
  status text not null default 'prospecto'
    check (status in ('prospecto','cliente','inactivo')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  title text not null,
  service text,
  amount numeric(12,2),
  currency text not null default 'USD' check (currency in ('USD','ARS','EUR')),
  status text not null default 'borrador'
    check (status in ('borrador','enviada','seguimiento','aprobada','rechazada')),
  proposal_url text,
  sent_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- client_name se conserva como fallback de los proyectos que no tengan client_id.
alter table projects
  add column if not exists client_id uuid references clients(id) on delete set null,
  add column if not exists quote_id uuid references quotes(id) on delete set null;

create index if not exists quotes_client_id_idx on quotes (client_id);
create index if not exists projects_client_id_idx on projects (client_id);
create index if not exists projects_quote_id_idx on projects (quote_id);

-- Mismo modelo que la V1: el acceso lo autoriza Clerk en el servidor y solo
-- entra la service role. RLS activo y sin políticas bloquea cualquier key pública.
alter table clients enable row level security;
alter table quotes enable row level security;
