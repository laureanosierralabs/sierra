-- Tipo de landing dentro de un lanzamiento: de registro (convierte en
-- registros) o de venta (convierte en compras). El panel mide cada una contra
-- lo suyo: a una página de venta no se le cuentan registros como conversión.
--
-- Rollback:
--   alter table launch_pages drop column kind;

alter table launch_pages
  add column if not exists kind text not null default 'registro';

alter table launch_pages
  drop constraint if exists launch_pages_kind_check;
alter table launch_pages
  add constraint launch_pages_kind_check check (kind in ('registro', 'venta'));

-- Las landings ya cargadas desde un proyecto de ventas pasan a "venta".
update launch_pages lp set kind = 'venta'
  from projects p
  where p.id = lp.project_id and p.page_type = 'ventas' and lp.kind = 'registro';
