-- Recursos a nivel cliente: cuentas que no pertenecen a un proyecto puntual
-- (su Gmail, Meta Business, hosting compartido entre varios proyectos).
-- Misma forma que project_resources: la contraseña va cifrada.

create table if not exists client_resources (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  kind text not null default 'otro'
    check (kind in ('archivo','diseno','infraestructura','marketing','acceso','otro')),
  url text,
  username text,
  secret_encrypted text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_resources_client_idx
  on client_resources (client_id);

alter table client_resources enable row level security;
