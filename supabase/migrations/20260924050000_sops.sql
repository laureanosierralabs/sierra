-- SOPs: procesos de trabajo y sus tareas plantilla.
-- Al crear un proyecto se copian las tareas del proceso elegido.

create table if not exists processes (
  id uuid primary key default gen_random_uuid(),
  -- Coincide con projects.kind: 'wordpress' | 'codigo' | los que sumes.
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists process_tasks (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references processes(id) on delete cascade,
  title text not null,
  -- Plantilla de formulario en código (briefing, etc). Null = solo checklist.
  template text,
  -- Pasos propios del SOP: [{texto, hijos?}]. Se copian a la tarea del proyecto.
  steps jsonb not null default '[]'::jsonb,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists process_tasks_process_idx
  on process_tasks (process_id, position);

-- La tarea guarda los pasos que tenía el SOP al crearse: editar el SOP después
-- no debe alterar proyectos en curso.
alter table tasks
  add column if not exists steps jsonb not null default '[]'::jsonb;

alter table processes enable row level security;
alter table process_tasks enable row level security;
