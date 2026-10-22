-- El portal como entrega del servicio: portadas, entregables, accesos y videos.
--
--   clients.portal_cover_url        Imagen de la marca en el inicio de su portal.
--   launches.cover_url              Flyer del lanzamiento (tarjeta del inicio).
--   launches.banner_url             Banner de la pantalla del lanzamiento.
--   launch_pages.deliverables       Entregables de cada landing: versiones en PDF
--                                   (ordenador, celular, tablet) y recursos
--                                   descargables. Son links (Drive): los archivos
--                                   viven en su herramienta.
--   client_resources.portal_visible Accesos que el cliente ve en su portal.
--   support_videos                  Videos de soporte que se muestran en todos
--                                   los portales.
--
-- Las imágenes van al bucket público "portadas" (el mismo de los proyectos).
--
-- Rollback:
--   alter table clients drop column portal_cover_url;
--   alter table launches drop column cover_url, drop column banner_url;
--   alter table launch_pages drop column deliverables;
--   alter table client_resources drop column portal_visible;
--   drop table support_videos;

alter table clients add column if not exists portal_cover_url text;
alter table launches add column if not exists cover_url text;
alter table launches add column if not exists banner_url text;

alter table launch_pages add column if not exists deliverables jsonb not null default '{}'::jsonb;
alter table launch_pages drop constraint if exists launch_pages_deliverables_object;
alter table launch_pages add constraint launch_pages_deliverables_object check (jsonb_typeof(deliverables) = 'object');

alter table client_resources add column if not exists portal_visible boolean not null default false;

create table if not exists support_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 80),
  url text not null check (url ~* '^https?://'),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table support_videos enable row level security;
