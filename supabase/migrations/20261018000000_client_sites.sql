-- Proyectos conectados: el repo de un cliente (con todas sus landings)
-- conectado al panel una sola vez con el "Sierra Launch Kit".
--
-- Los datos se guardan por proyecto y por RUTA (/registro-a), no por
-- lanzamiento: una landing nueva se mide sola desde su primera visita, y un
-- lanzamiento suma las rutas que elige entre sus fechas. La misma landing
-- sirve para varios lanzamientos sin duplicar nada.
--
-- Las conversiones (registros, compras) las manda el SERVIDOR del proyecto,
-- firmadas con un secreto: no las frena un bloqueador de anuncios y son el
-- envío real del formulario o el pago confirmado.
--
-- Rollback (en este orden):
--   delete from process_tasks where title = 'Conectar el proyecto al panel (Sierra Launch Kit)';
--   drop function site_paths(uuid, uuid);
--   drop function site_visit_stats(uuid, uuid, text[], date, date);
--   alter table launch_pages drop column site_id, drop column path;
--   drop table site_conversions; drop table site_visits; drop table client_sites;

create table if not exists client_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  -- Dominio público del proyecto (sin https://), para armar los links.
  domain text,
  -- Clave pública: va en el HTML (script de visitas) y en el encabezado de
  -- cada conversión. No es un secreto.
  site_key text not null unique default replace(gen_random_uuid()::text, '-', ''),
  -- Secreto de firma de las conversiones, cifrado con la clave de la app.
  ingest_secret_encrypted text not null,
  last_event_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_sites_client_id_idx on client_sites (client_id);

create table if not exists site_visits (
  id bigint generated always as identity primary key,
  site_id uuid not null references client_sites(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  path text not null,
  day date not null,
  -- Huellas con la clave del servidor (como launch_visits): sin IP ni cookies.
  visitor_hash text not null,
  ip_hash text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer_host text,
  visited_at timestamptz not null default now(),
  -- Un visitante cuenta una vez por ruta y por día.
  unique (site_id, path, visitor_hash, day)
);

create index if not exists site_visits_site_day_idx on site_visits (site_id, day);
create index if not exists site_visits_ip_idx on site_visits (site_id, path, day, ip_hash);
create index if not exists site_visits_client_id_idx on site_visits (client_id);

create table if not exists site_conversions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references client_sites(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null check (kind in ('lead', 'purchase')),
  -- Id único que manda el proyecto: un reintento no duplica.
  event_id text not null,
  path text,
  email text,
  name text,
  phone text,
  amount numeric(12,2) check (amount is null or amount >= 0),
  currency text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (site_id, event_id)
);

create index if not exists site_conversions_site_idx on site_conversions (site_id, occurred_at desc);
create index if not exists site_conversions_path_idx on site_conversions (site_id, path);
create index if not exists site_conversions_client_id_idx on site_conversions (client_id);

-- Una landing de un lanzamiento puede ser una ruta de un proyecto conectado.
alter table launch_pages
  add column if not exists site_id uuid references client_sites(id) on delete set null,
  add column if not exists path text;

create index if not exists launch_pages_site_id_idx on launch_pages (site_id);
create unique index if not exists launch_pages_site_path_idx
  on launch_pages (launch_id, site_id, path)
  where site_id is not null;

alter table client_sites enable row level security;
alter table site_visits enable row level security;
alter table site_conversions enable row level security;
revoke all on table client_sites, site_visits, site_conversions from public, anon, authenticated;
grant all on table client_sites, site_visits, site_conversions to service_role;

-- Visitantes por ruta, día y fuente de un proyecto, solo para las rutas y el
-- período pedidos (los de un lanzamiento). Filtra por cliente Y proyecto.
create or replace function site_visit_stats(
  p_client uuid,
  p_site uuid,
  p_paths text[],
  p_from date,
  p_to date
)
returns table (path text, day date, utm_source text, visitors bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select v.path, v.day, v.utm_source, count(*)::bigint
  from site_visits v
  where v.client_id = p_client
    and v.site_id = p_site
    and v.path = any (p_paths)
    and v.day between p_from and p_to
  group by v.path, v.day, v.utm_source
$$;

-- Rutas que el proyecto fue mostrando (por visitas o conversiones), con su
-- última actividad: así una landing nueva aparece sola en el panel.
create or replace function site_paths(p_client uuid, p_site uuid)
returns table (path text, last_seen date, visitors bigint, conversions bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with visitas as (
    select v.path, max(v.day) as ultimo, count(*)::bigint as n
    from site_visits v
    where v.client_id = p_client and v.site_id = p_site
    group by v.path
  ),
  conversiones as (
    select c.path, max(c.occurred_at)::date as ultimo, count(*)::bigint as n
    from site_conversions c
    where c.client_id = p_client and c.site_id = p_site and c.path is not null
    group by c.path
  )
  select
    coalesce(v.path, c.path),
    greatest(v.ultimo, c.ultimo),
    coalesce(v.n, 0),
    coalesce(c.n, 0)
  from visitas v
  full outer join conversiones c on c.path = v.path
$$;

revoke all on function site_visit_stats(uuid, uuid, text[], date, date) from public, anon, authenticated;
revoke all on function site_paths(uuid, uuid) from public, anon, authenticated;
grant execute on function site_visit_stats(uuid, uuid, text[], date, date) to service_role;
grant execute on function site_paths(uuid, uuid) to service_role;

-- SOP: cada proyecto de código nuevo trae la tarea de conectarlo al panel.
insert into process_tasks (process_id, title, steps, notes, position)
select
  p.id,
  'Conectar el proyecto al panel (Sierra Launch Kit)',
  '[
    {"texto": "En el panel: ficha del cliente → Proyectos conectados → Conectar proyecto (nombre y dominio)"},
    {"texto": "Copiar las 3 variables y cargarlas en Vercel del proyecto (Production y Preview)", "hijos": [
      "NEXT_PUBLIC_SIERRA_URL",
      "NEXT_PUBLIC_SIERRA_SITE_KEY",
      "SIERRA_INGEST_SECRET (solo servidor: nunca con NEXT_PUBLIC_)"
    ]},
    {"texto": "Copiar el prompt de integración desde el panel y correrlo en el repo del cliente con Claude Code"},
    {"texto": "Revisar el diff: <SierraTracking /> en el layout raíz, <SierraCampos /> en cada formulario y registrarLead / registrarCompra en el servidor (formularios y webhook de pagos)"},
    {"texto": "Desplegar y verificar en el panel: aparece la ruta con una visita y llega un registro de prueba"}
  ]'::jsonb,
  'Conecta el repo del cliente al panel una sola vez: todas sus landings (las de hoy y las que se agreguen) quedan medidas. El prompt para Claude Code y las variables de entorno se copian desde la ficha del cliente, en "Proyectos conectados". Las API keys de MailerLite, GoHighLevel y Stripe se quedan en el proyecto del cliente: el panel no las necesita.',
  coalesce((select max(position) + 1 from process_tasks t where t.process_id = p.id), 0)
from processes p
where p.slug = 'codigo'
  and not exists (
    select 1 from process_tasks t
    where t.process_id = p.id and t.title = 'Conectar el proyecto al panel (Sierra Launch Kit)'
  );
