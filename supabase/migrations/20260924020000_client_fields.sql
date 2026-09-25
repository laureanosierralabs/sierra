-- Campos de ficha de cliente: de dónde vino, a qué se dedica y sus enlaces.

alter table clients
  add column if not exists source text
    check (source is null or source in
      ('recomendacion','publicidad','redes','busqueda','evento','otro')),
  -- Detalle libre del origen: "Instagram", "Meta Ads", "me refirió Pilar".
  add column if not exists source_detail text,
  add column if not exists niche text,
  add column if not exists website text,
  add column if not exists drive_url text;
