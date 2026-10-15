-- Datos extra de un registro: las columnas de un CSV importado que no son
-- nombre, email, teléfono, fecha ni UTM (por ejemplo las respuestas de un
-- diagnóstico). Se guardan tal cual, como texto, para poder exportarlas.
--
-- Rollback:
--   alter table launch_registrations drop column extra;

alter table launch_registrations
  add column if not exists extra jsonb not null default '{}'::jsonb;
