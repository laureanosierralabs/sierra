-- El nombre del portal en la URL (/portal/<slug>) pasa a guardarse acá.
--
-- La primera versión usaba el slug de la organización de Clerk, pero los
-- slugs de organización son una función opcional de Clerk (desactivada por
-- defecto en instancias nuevas): crear la organización con slug falla si no
-- está activa. Con el slug propio, el portal no depende de esa configuración.
--
-- Rollback: alter table client_orgs drop column slug;

alter table client_orgs
  add column if not exists slug text;

-- Por si quedó alguna fila de la versión anterior: un valor único y válido.
update client_orgs set slug = client_id::text where slug is null;

alter table client_orgs
  alter column slug set not null;

create unique index if not exists client_orgs_slug_idx on client_orgs (slug);
