-- Contenido de la página de tarea: respuestas del formulario + plantilla.
-- Aditiva: no toca datos existentes.

alter table tasks
  -- Qué formulario renderiza la tarea (briefing, etc). Null = sin plantilla.
  add column if not exists template text,
  -- Respuestas del formulario, por id de campo. La forma la define la plantilla.
  add column if not exists content jsonb not null default '{}'::jsonb;
