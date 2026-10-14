-- Marca y operador/a.
--
-- El cliente de un proyecto es la MARCA (Aida Qui, Pilar Sousa): ahí viven
-- sus landings, lanzamientos, proyecto conectado y portal. La persona detrás
-- de la marca (su growth operator: Oriana, Ismael) es otro cliente, que la
-- opera y suele ser quien paga (cliente de las cotizaciones). Hasta ahora los
-- proyectos se cargaban a nombre de quien paga, así que agrupar por cliente
-- mostraba "Oriana" con las landings de Aida adentro.
--
-- Rollback:
--   update projects p set client_id = c.operated_by
--     from clients c where p.client_id = c.id and c.operated_by is not null;
--   alter table clients drop column operated_by;
--   (y borrar "Aida Qui" si se creó acá y quedó sin uso)

alter table clients
  add column if not exists operated_by uuid references clients(id) on delete set null;

alter table clients
  drop constraint if exists clients_operated_by_no_self;
alter table clients
  add constraint clients_operated_by_no_self check (operated_by is null or operated_by <> id);

create index if not exists clients_operated_by_idx
  on clients (operated_by)
  where operated_by is not null;

-- Solo se mueven PROYECTOS. Lanzamientos, proyectos conectados y portal que
-- se hayan creado a nombre del operador quedan donde están: se recrean a
-- nombre de la marca (eran pruebas).
--
-- Datos (indicado por Laureano, 2026-10-15): Aida Qui es la marca operada por
-- Oriana Safenreider; Pilar Sousa, la marca operada por Ismael El Haddar. Sus
-- proyectos pasan a la marca (los nombres terminan en "| Aida Qui" / "| Pilar
-- Sousa"). Las cotizaciones NO se tocan: quien paga sigue siendo el operador.
-- Idempotente: correrla dos veces no crea ni mueve nada de más.
do $$
declare
  oriana uuid;
  ismael uuid;
  aida uuid;
  pilar uuid;
begin
  -- trim: un espacio de más en el nombre no tiene que saltear el cambio.
  -- order by: con nombres duplicados, siempre el mismo (el más viejo).
  select id into oriana from clients where lower(trim(name)) = 'oriana safenreider' order by created_at limit 1;
  select id into ismael from clients where lower(trim(name)) = 'ismael el haddar' order by created_at limit 1;
  select id into pilar from clients where lower(trim(name)) = 'pilar sousa' order by created_at limit 1;
  select id into aida from clients where lower(trim(name)) = 'aida qui' order by created_at limit 1;

  if oriana is not null then
    if aida is null then
      insert into clients (name, status, notes)
      values ('Aida Qui', 'cliente', 'Marca operada por Oriana Safenreider.')
      returning id into aida;
    end if;
    update clients set operated_by = oriana where id = aida and operated_by is null;
    update projects set client_id = aida
      where client_id = oriana and name ilike '%| aida qui%';
  end if;

  if ismael is not null and pilar is not null then
    update clients set operated_by = ismael where id = pilar and operated_by is null;
    update projects set client_id = pilar
      where client_id = ismael and name ilike '%| pilar sousa%';
  end if;
end $$;
