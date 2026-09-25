-- Tipo de proyecto: define qué plantillas de tarea se crean al nacer.
-- Un proyecto WordPress y uno a código comparten el flujo pero no el checklist.

alter table projects
  add column if not exists kind text not null default 'wordpress'
    check (kind in ('wordpress', 'codigo'));
