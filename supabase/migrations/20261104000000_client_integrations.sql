-- Conexión por cliente con herramientas externas (por ahora GoHighLevel) y el
-- mapeo etiqueta -> landing con el que se importan ventas a launch_sale_imports.
--
-- El token (Private Integration Token) se guarda CIFRADO con CREDENTIALS_KEY,
-- igual que las credenciales de los recursos: nunca viaja al navegador.
-- `last_sync_result` guarda el resumen de la última corrida y el cursor para
-- retomar si la corrida se cortó por tiempo.
--
-- Rollback:
--   drop table ghl_sale_mappings;
--   drop table client_integrations;

create table if not exists client_integrations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  provider text not null check (provider in ('ghl')),
  location_id text,
  token_encrypted text,
  last_sync_at timestamptz,
  last_sync_result jsonb,
  created_at timestamptz not null default now(),
  -- Una conexión por proveedor y cliente.
  unique (client_id, provider)
);

create table if not exists ghl_sale_mappings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  integration_id uuid not null references client_integrations(id) on delete cascade,
  tag text not null,
  page_id uuid not null references launch_pages(id) on delete cascade,
  amount numeric(12,2),
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  unique (integration_id, tag, page_id)
);

create index if not exists ghl_sale_mappings_integration_idx on ghl_sale_mappings (integration_id);
create index if not exists ghl_sale_mappings_client_idx on ghl_sale_mappings (client_id);

alter table client_integrations enable row level security;
revoke all on table client_integrations from public, anon, authenticated;
grant all on table client_integrations to service_role;

alter table ghl_sale_mappings enable row level security;
revoke all on table ghl_sale_mappings from public, anon, authenticated;
grant all on table ghl_sale_mappings to service_role;
