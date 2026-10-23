-- Qué pasa DESPUÉS del registro y cerca de la venta, atado a la persona
-- (email) cuando se la conoce:
--   * site_events: clic al grupo de WhatsApp (whatsapp_click) y clic a un
--     checkout desde una página de ventas (checkout_click). Los manda el kit
--     de las landings a POST /api/e (público, sin cookies ni IP guardada).
--   * launch_events: la persona entró al webinar con su link personal
--     (webinar_join). Lo registra el panel en GET /w/[token]?e=<email>.
--   * launches.webinar_url / webinar_token: a dónde manda el link personal y
--     el token público que identifica al lanzamiento en ese link.
--
-- Dedupe: un evento de sitio cuenta una vez por (proyecto, tipo, ruta,
-- email-o-visitante, día); un ingreso al webinar, una vez por (lanzamiento,
-- email, día). Los reintentos chocan con el índice único y se ignoran.
--
-- Rollback (en este orden):
--   drop table launch_events;
--   drop table site_events;
--   alter table launches drop column webinar_token, drop column webinar_url;

create table if not exists site_events (
  id bigint generated always as identity primary key,
  site_id uuid not null references client_sites(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null check (kind in ('whatsapp_click', 'checkout_click')),
  -- Ruta de la página donde pasó el clic (la de gracias, la de ventas).
  path text not null,
  -- Email de la persona si la landing lo sabe; si no, solo la huella.
  email text,
  -- Huella con la clave del servidor (sitio + día + IP + navegador): sin IP ni cookies.
  visitor_hash text,
  ip_hash text,
  -- Qué botón o a qué host fue el clic (texto del botón, host del checkout).
  target text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  day date not null,
  occurred_at timestamptz not null default now(),
  check (email is not null or visitor_hash is not null)
);

-- Una persona (email o visitante) cuenta una vez por tipo, ruta y día.
create unique index if not exists site_events_dedupe_idx
  on site_events (site_id, kind, path, coalesce(email, visitor_hash), day);
create index if not exists site_events_site_path_day_idx on site_events (site_id, path, day);
create index if not exists site_events_ip_idx on site_events (site_id, day, ip_hash);
create index if not exists site_events_client_id_idx on site_events (client_id);

create table if not exists launch_events (
  id bigint generated always as identity primary key,
  launch_id uuid not null references launches(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null check (kind in ('webinar_join')),
  email text not null,
  day date not null,
  occurred_at timestamptz not null default now(),
  unique (launch_id, kind, email, day)
);

create index if not exists launch_events_client_id_idx on launch_events (client_id);

alter table launches
  add column if not exists webinar_url text,
  -- Token público del link personal /w/<token>?e=<email>. Cada fila existente
  -- recibe el suyo (el default volátil se evalúa por fila).
  add column if not exists webinar_token text not null default replace(gen_random_uuid()::text, '-', '');

create unique index if not exists launches_webinar_token_idx on launches (webinar_token);

alter table site_events enable row level security;
alter table launch_events enable row level security;
revoke all on table site_events, launch_events from public, anon, authenticated;
grant all on table site_events, launch_events to service_role;
