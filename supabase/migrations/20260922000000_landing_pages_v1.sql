-- Landing Pages V1 — correr en Supabase > SQL Editor.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text,
  status text not null default 'por-iniciar'
    check (status in ('por-iniciar','en-progreso','en-revision','esperando-cliente','entregado')),
  responsible_user_id text,
  due_date date,
  priority text not null default 'media' check (priority in ('alta','media','baja')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pendiente'
    check (status in ('pendiente','en-progreso','en-revision','bloqueada','completada')),
  assigned_to text,
  priority text not null default 'media' check (priority in ('alta','media','baja')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on tasks (project_id);

-- El acceso lo autoriza Clerk en el servidor. RLS queda activo y sin políticas:
-- cualquier key pública (anon) no lee ni escribe nada. Solo la service role entra.
alter table projects enable row level security;
alter table tasks enable row level security;
