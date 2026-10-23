-- Visitantes sin utm_source, por dominio de origen (referrer_host), para el
-- panel de lanzamientos: "Tráfico sin UTM, por origen". Hoy esas visitas solo
-- se ven juntas como "Sin UTM"; con esto se separan en Instagram, Facebook,
-- directo, etc.
--
-- Son funciones de lectura, iguales en filtros y seguridad a
-- launch_visit_stats (20261029000000) y site_visit_stats (20261018000000).
-- No cambian tablas ni datos.
--
-- Rollback:
--   drop function launch_referrer_stats(uuid, uuid);
--   drop function site_referrer_stats(uuid, uuid, text[], date, date);

-- Landings sueltas de un lanzamiento: visitas propias (una fila por visitante)
-- más las importadas de Vercel (ya agregadas), filtradas por la landing actual.
create or replace function launch_referrer_stats(p_client uuid, p_launch uuid)
returns table (page_id uuid, day date, referrer_host text, visitors bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select v.page_id, v.day, v.referrer_host, count(*)::bigint
  from launch_visits v
  where v.client_id = p_client and v.launch_id = p_launch and v.utm_source is null
  group by v.page_id, v.day, v.referrer_host
  union all
  select i.page_id, i.day, i.referrer_host, sum(i.visitors)::bigint
  from launch_visit_imports i
  join launch_pages p on p.id = i.page_id
  where i.client_id = p_client and p.launch_id = p_launch
  group by i.page_id, i.day, i.referrer_host
$$;

-- Rutas de un proyecto conectado, en un período. Filtra por cliente Y proyecto.
create or replace function site_referrer_stats(
  p_client uuid,
  p_site uuid,
  p_paths text[],
  p_from date,
  p_to date
)
returns table (path text, day date, referrer_host text, visitors bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select v.path, v.day, v.referrer_host, count(*)::bigint
  from site_visits v
  where v.client_id = p_client
    and v.site_id = p_site
    and v.path = any (p_paths)
    and v.day between p_from and p_to
    and v.utm_source is null
  group by v.path, v.day, v.referrer_host
$$;

revoke all on function launch_referrer_stats(uuid, uuid) from public, anon, authenticated;
revoke all on function site_referrer_stats(uuid, uuid, text[], date, date) from public, anon, authenticated;
grant execute on function launch_referrer_stats(uuid, uuid) to service_role;
grant execute on function site_referrer_stats(uuid, uuid, text[], date, date) to service_role;
