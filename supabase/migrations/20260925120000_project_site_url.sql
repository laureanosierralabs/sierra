-- URL del sitio publicado. Vivía entre los recursos, pero es el link que más
-- se abre: merece estar a un click desde la card.

alter table projects
  add column if not exists site_url text;
