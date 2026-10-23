-- Visitas importadas de otra herramienta (Vercel Web Analytics) para los días
-- en que la landing todavía no tenía el script del panel. Llegan ya
-- agregadas (visitantes por landing y día), por eso no van en launch_visits,
-- que guarda una fila por visitante.
--
-- Cada fila dice de dónde salió (`source`). Solo se importan días sin datos
-- propios, así una visita no se cuenta dos veces.
--
-- `referrer_host` es el dominio de origen que da Vercel. En su plan no hay
-- desglose por UTM, así que `utm_source` queda vacío: no se rellena con el
-- referrer.
--
-- Rollback:
--   create or replace function launch_visit_stats ... (versión de 20261016000000);
--   drop table launch_visit_imports;

create table if not exists launch_visit_imports (
  id bigint generated always as identity primary key,
  page_id uuid not null references launch_pages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  day date not null,
  referrer_host text,
  visitors integer not null check (visitors > 0),
  source text not null check (source in ('vercel')),
  created_at timestamptz not null default now(),
  -- Reimportar el mismo día no duplica.
  unique nulls not distinct (page_id, day, referrer_host, source)
);

create index if not exists launch_visit_imports_page_idx on launch_visit_imports (page_id, day);
create index if not exists launch_visit_imports_client_idx on launch_visit_imports (client_id);

alter table launch_visit_imports enable row level security;
revoke all on table launch_visit_imports from public, anon, authenticated;
grant all on table launch_visit_imports to service_role;

-- Las visitas importadas se suman a las propias. Se filtran por la landing
-- (no por un launch_id propio): si una landing cambia de lanzamiento, sus
-- visitas importadas la siguen.
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
  union all
  select i.page_id, i.day, null::text, sum(i.visitors)::bigint
  from launch_visit_imports i
  join launch_pages p on p.id = i.page_id
  where i.client_id = p_client and p.launch_id = p_launch
  group by i.page_id, i.day
$$;

revoke all on function launch_visit_stats(uuid, uuid) from public, anon, authenticated;
grant execute on function launch_visit_stats(uuid, uuid) to service_role;
