-- Detalle de proyecto: etapa, recursos, anotaciones y orden del kanban.
-- Aditiva: no toca estados ni datos existentes.

-- La etapa es independiente del estado: un proyecto "en-progreso" puede estar
-- en diseño o en desarrollo. Nullable porque no todos la usan.
alter table projects
  add column if not exists stage text
    check (stage is null or stage in
      ('briefing','recoleccion','diseno','desarrollo','revision','cambios','entrega')),
  add column if not exists notes_important text,
  add column if not exists cover_url text;

-- Genérica a propósito: sumar Vercel, Make o Analytics no debe tocar el schema.
create table if not exists project_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  kind text not null default 'otro'
    check (kind in ('archivo','diseno','infraestructura','marketing','acceso','otro')),
  url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_resources_project_id_idx
  on project_resources (project_id);

-- Sin esto las tarjetas del kanban saltan de lugar al recargar.
alter table tasks
  add column if not exists position integer not null default 0;

create index if not exists tasks_project_position_idx
  on tasks (project_id, status, position);

alter table project_resources enable row level security;
