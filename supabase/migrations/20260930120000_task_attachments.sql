-- Adjuntos de tarea: links y archivos.
--
-- Proyectos y clientes ya tenían su sección de Recursos, pero la tarea no:
-- el brief de un briefing, el Fathom de una reunión o el Figma de un diseño
-- no tenían dónde vivir y terminaban pegados en una nota suelta.
--
-- Una fila es un link (url) o un archivo subido (storage_path), nunca las
-- dos cosas. El check lo garantiza: sin eso quedan filas ambiguas que la UI
-- no sabe cómo mostrar.

create table if not exists task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  name text not null,
  url text,
  -- Ruta dentro del bucket privado "adjuntos". Se sirve con URL firmada,
  -- nunca pública: puede contener material del cliente.
  storage_path text,
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now(),

  constraint task_attachments_uno_u_otro check (
    (url is not null and storage_path is null) or
    (url is null and storage_path is not null)
  )
);

create index if not exists task_attachments_task_id_idx
  on task_attachments (task_id);

alter table task_attachments enable row level security;
