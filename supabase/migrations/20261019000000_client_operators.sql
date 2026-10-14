-- Marca y operador/a.
--
-- El cliente de un proyecto es la MARCA (Aida Qui, Pilar Sousa): ahí viven
-- sus landings, cotizaciones (la marca es quien paga), accesos, lanzamientos,
-- proyecto conectado y portal. La persona que la opera (su growth operator:
-- Oriana, Ismael) es otro cliente, enlazado con operated_by. Hasta ahora todo
-- se cargaba a nombre del operador, así que agrupar por cliente mostraba
-- "Oriana" con las landings de Aida adentro.
--
-- Rollback:
--   update quotes q set client_id = c.operated_by
--     from clients c where q.client_id = c.id and c.operated_by is not null;
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

-- Se mueven PROYECTOS y las COTIZACIONES cuyos proyectos son todos de la
-- marca. Una cotización sin proyectos vinculados queda donde está (se cambia
-- a mano). Lanzamientos, proyectos conectados y portal creados a nombre del
-- operador tampoco se mueven: se recrean a nombre de la marca (eran pruebas).
--
-- Datos (indicado por Laureano, 2026-10-15): Aida Qui es la marca operada por
-- Oriana Safenreider; Pilar Sousa, la marca operada por Ismael El Haddar. Sus
-- proyectos pasan a la marca (los nombres terminan en "| Aida Qui" o
-- "| Academia ADN" / "| Pilar Sousa"). Idempotente: correrla dos veces no
-- crea ni mueve nada de más.
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
    -- "| Academia ADN" es la academia de Aida (páginas de registro).
    update projects set client_id = aida
      where client_id = oriana and (name ilike '%| aida qui%' or name ilike '%| academia adn%');
    update quotes q set client_id = aida
      where q.client_id = oriana
        and exists (select 1 from quote_projects qp where qp.quote_id = q.id)
        and not exists (
          select 1 from quote_projects qp join projects p on p.id = qp.project_id
          where qp.quote_id = q.id and p.client_id is distinct from aida
        );
  end if;

  if ismael is not null and pilar is not null then
    update clients set operated_by = ismael where id = pilar and operated_by is null;
    update projects set client_id = pilar
      where client_id = ismael and name ilike '%| pilar sousa%';
    update quotes q set client_id = pilar
      where q.client_id = ismael
        and exists (select 1 from quote_projects qp where qp.quote_id = q.id)
        and not exists (
          select 1 from quote_projects qp join projects p on p.id = qp.project_id
          where qp.quote_id = q.id and p.client_id is distinct from pilar
        );
  end if;

  -- Una landing de lanzamiento solo puede apuntar a un proyecto de su mismo
  -- cliente: si el proyecto se mudó, se desvincula (el lanzamiento sigue).
  update launch_pages lp set project_id = null
    from projects p
    where p.id = lp.project_id and p.client_id is distinct from lp.client_id;
end $$;
