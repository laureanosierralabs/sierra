-- Conclusiones del reporte de cierre de un lanzamiento: lo que aprendimos y
-- los próximos pasos. Lo escribe el owner; el cliente lo lee en su reporte.
--
-- Rollback:
--   alter table launches drop column closing_notes;

alter table launches
  add column if not exists closing_notes text
  check (closing_notes is null or length(closing_notes) <= 10000);
