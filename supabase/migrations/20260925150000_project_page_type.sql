-- Tipo de página: registro, ventas, etc. Va como etiqueta en la card para no
-- tener que meterlo en el nombre del proyecto.

alter table projects
  add column if not exists page_type text
    check (page_type is null or page_type in
      ('registro','ventas','lead-magnet','portfolio','institucional','otro'));
