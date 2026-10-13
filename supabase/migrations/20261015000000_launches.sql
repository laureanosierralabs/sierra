-- Portal de clientes: lanzamientos, sus landings y los registros que entran.
--
-- Un lanzamiento es de un cliente y agrupa las landings (o variantes) que se
-- prueban. Cada landing se identifica por el grupo de MailerLite al que suma
-- a quien se registra: así el webhook sabe de qué landing vino cada persona
-- sin tocar el formulario.
--
-- `client_id` va en las tres tablas (aunque se pueda derivar del
-- lanzamiento): es la clave de aislamiento del portal. Toda consulta del
-- portal filtra por ella, y las políticas RLS por organización se apoyan en
-- la misma columna.
--
-- Rollback (en este orden):
--   drop table webhook_log; drop table launch_registrations;
--   drop table launch_pages; drop table launches;

create table if not exists launches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  status text not null default 'preparacion'
    check (status in ('preparacion', 'activo', 'cerrado')),
  starts_on date,
  ends_on date,
  -- Meta de registros, para mostrar el ritmo. Null = sin meta.
  goal_registrations integer check (goal_registrations > 0),
  -- Token de la URL del webhook: largo y aleatorio, es lo que identifica al
  -- lanzamiento cuando MailerLite llama.
  webhook_token text not null unique,
  -- Secreto con el que MailerLite firma cada envío, cifrado con la clave de
  -- la app (igual que las credenciales de recursos). Null = sin firma.
  webhook_secret_encrypted text,
  mailerlite_webhook_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists launches_client_id_idx on launches (client_id);

create table if not exists launch_pages (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references launches(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  url text,
  thanks_url text,
  whatsapp_url text,
  checkout_url text,
  project_id uuid references projects(id) on delete set null,
  mailerlite_group_id text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists launch_pages_launch_idx on launch_pages (launch_id, position);
create index if not exists launch_pages_client_id_idx on launch_pages (client_id);
create index if not exists launch_pages_project_id_idx on launch_pages (project_id);
-- Un grupo identifica a una sola landing dentro del lanzamiento.
create unique index if not exists launch_pages_group_idx
  on launch_pages (launch_id, mailerlite_group_id)
  where mailerlite_group_id is not null;

create table if not exists launch_registrations (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references launches(id) on delete cascade,
  page_id uuid references launch_pages(id) on delete set null,
  client_id uuid not null references clients(id) on delete cascade,
  -- Id del suscriptor en el proveedor (MailerLite).
  external_id text not null,
  email text not null,
  name text,
  phone text,
  source text not null default 'mailerlite',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  registered_at timestamptz not null,
  created_at timestamptz not null default now(),
  -- Idempotencia: MailerLite reintenta los envíos, y una persona que pasa
  -- por dos landings cuenta una vez (la primera).
  unique (launch_id, external_id)
);

create index if not exists launch_registrations_launch_idx
  on launch_registrations (launch_id, registered_at desc);
create index if not exists launch_registrations_page_id_idx on launch_registrations (page_id);
create index if not exists launch_registrations_client_id_idx on launch_registrations (client_id);

-- Bitácora de lo que llega por webhook: para responder "¿por qué no entró el
-- registro?". Sin datos personales: solo si la firma validó y qué se procesó.
create table if not exists webhook_log (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid references launches(id) on delete cascade,
  provider text not null,
  received_at timestamptz not null default now(),
  signature_ok boolean,
  events integer not null default 0,
  stored integer not null default 0,
  error text
);

create index if not exists webhook_log_launch_idx on webhook_log (launch_id, received_at desc);

alter table launches enable row level security;
alter table launch_pages enable row level security;
alter table launch_registrations enable row level security;
alter table webhook_log enable row level security;

-- Solo la service role, como el resto del portal. Las políticas por
-- organización llegan con el acceso directo desde el portal (fase de RLS).
revoke all on table launches, launch_pages, launch_registrations, webhook_log
  from public, anon, authenticated;
grant all on table launches, launch_pages, launch_registrations, webhook_log
  to service_role;
