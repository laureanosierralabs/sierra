-- Pedidos: lo operativo entre el cliente y el equipo, fuera de WhatsApp.
--
--   incidencia  la crea el cliente: algo no funciona.
--   cambio      la crea el cliente: quiere que se modifique algo.
--   aprobacion  la crea el equipo: el cliente aprueba o rechaza.
--
-- Cada pedido tiene estado, prioridad y un hilo de comentarios. Como el resto
-- del portal, se aísla por client_id y solo la service role lee y escribe.
--
-- Rollback:
--   drop table client_request_comments; drop table client_requests;

create table if not exists client_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  launch_id uuid references launches(id) on delete set null,
  kind text not null check (kind in ('incidencia', 'cambio', 'aprobacion')),
  title text not null check (length(trim(title)) between 1 and 200),
  description text check (description is null or length(description) <= 5000),
  priority text not null default 'normal' check (priority in ('normal', 'urgente')),
  -- abierta → en_curso → resuelta | descartada (incidencias y cambios)
  -- abierta → aprobada | rechazada (aprobaciones: decide el cliente)
  status text not null default 'abierta'
    check (status in ('abierta', 'en_curso', 'resuelta', 'descartada', 'aprobada', 'rechazada')),
  -- Link a lo que hay que mirar o aprobar (la landing, un Figma, un Doc).
  link text check (link is null or link ~* '^https?://'),
  created_by text not null,
  created_by_name text,
  from_client boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists client_requests_client_idx on client_requests (client_id, created_at desc);
create index if not exists client_requests_status_idx on client_requests (status, created_at desc);
create index if not exists client_requests_launch_idx on client_requests (launch_id);

create table if not exists client_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references client_requests(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  author_id text not null,
  author_name text,
  from_client boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists client_request_comments_request_idx on client_request_comments (request_id, created_at);
create index if not exists client_request_comments_client_idx on client_request_comments (client_id);

alter table client_requests enable row level security;
alter table client_request_comments enable row level security;
