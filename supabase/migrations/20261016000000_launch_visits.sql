-- Visitas a las landings de un lanzamiento: lo que falta para mostrar
-- visitantes y conversión (registros / visitantes).
--
-- Privacidad: no se guarda la IP ni se usan cookies. `visitor_hash` y
-- `ip_hash` son huellas (HMAC con una clave que vive solo en el servidor)
-- que incluyen el día: no permiten seguir a una persona entre días, y sin la
-- clave del servidor no se puede volver a la IP. Se guarda UNA fila por
-- visitante, landing y día: da visitantes únicos diarios directo y mantiene
-- la tabla chica.
--
-- Retención: la tabla no se purga sola. Cerrado un lanzamiento, sus visitas
-- se pueden borrar con: delete from launch_visits where launch_id = ...;
--
-- Rollback:
--   drop function launch_visit_stats(uuid, uuid);
--   drop table launch_visits;
--   alter table launch_pages drop column track_key;

-- Clave pública del script de cada landing (va en el HTML de la landing, no
-- es un secreto): identifica la landing sin exponer su id interno.
alter table launch_pages
  add column if not exists track_key text;

update launch_pages
  set track_key = replace(gen_random_uuid()::text, '-', '')
  where track_key is null;

alter table launch_pages
  alter column track_key set default replace(gen_random_uuid()::text, '-', ''),
  alter column track_key set not null;

create unique index if not exists launch_pages_track_key_idx on launch_pages (track_key);

create table if not exists launch_visits (
  id bigint generated always as identity primary key,
  launch_id uuid not null references launches(id) on delete cascade,
  page_id uuid not null references launch_pages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  day date not null,
  visitor_hash text not null,
  -- Huella de la IP sola: limita cuántos visitantes distintos puede declarar
  -- una misma IP por día (freno al inflado de visitas), sin guardar la IP.
  ip_hash text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  -- Solo el dominio de origen (instagram.com), nunca la URL completa.
  referrer_host text,
  visited_at timestamptz not null default now(),
  -- Un visitante cuenta una vez por landing y por día.
  unique (page_id, visitor_hash, day)
);

create index if not exists launch_visits_launch_idx on launch_visits (launch_id, day);
create index if not exists launch_visits_ip_idx on launch_visits (page_id, day, ip_hash);
create index if not exists launch_visits_client_id_idx on launch_visits (client_id);

alter table launch_visits enable row level security;
revoke all on table launch_visits from public, anon, authenticated;
grant all on table launch_visits to service_role;

-- Visitantes agregados por landing, día y fuente. Agregar en la base evita
-- traer miles de filas para contar. Filtra por cliente Y lanzamiento: la
-- clave de aislamiento va en la consulta, igual que en el resto del portal.
create or replace function launch_visit_stats(p_client uuid, p_launch uuid)
returns table (page_id uuid, day date, utm_source text, visitors bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select v.page_id, v.day, v.utm_source, count(*)::bigint
  from launch_visits v
  where v.client_id = p_client and v.launch_id = p_launch
  group by v.page_id, v.day, v.utm_source
$$;

revoke all on function launch_visit_stats(uuid, uuid) from public, anon, authenticated;
grant execute on function launch_visit_stats(uuid, uuid) to service_role;
