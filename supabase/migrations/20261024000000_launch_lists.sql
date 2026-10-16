-- Listas para cruzar con los registros de un lanzamiento: asistentes del
-- webinar (Zoom), miembros del grupo de WhatsApp, compradores (Stripe,
-- Hotmart). Se cruzan por email o teléfono y arman el embudo que sigue
-- después del registro, por landing y por fuente.
--
-- Rollback:
--   drop table launch_list_members; drop table launch_lists;

create table if not exists launch_lists (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references launches(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  -- Un nombre por lanzamiento: reimportar "Asistió al webinar" reemplaza la lista.
  unique (launch_id, name)
);

create index if not exists launch_lists_client_idx on launch_lists (client_id);

create table if not exists launch_list_members (
  id bigint generated always as identity primary key,
  list_id uuid not null references launch_lists(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  -- Normalizados para cruzar: email en minúsculas, teléfono solo dígitos.
  email text,
  phone text,
  check (email is not null or phone is not null)
);

create index if not exists launch_list_members_list_idx on launch_list_members (list_id);
create index if not exists launch_list_members_client_idx on launch_list_members (client_id);

alter table launch_lists enable row level security;
alter table launch_list_members enable row level security;
