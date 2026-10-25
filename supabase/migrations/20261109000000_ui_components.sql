-- Biblioteca de componentes para landings: código, prompt y referencias de
-- componentes que el equipo quiere reusar. Se lee y escribe solo con la
-- service role desde el panel, así que RLS queda activo y sin policies públicas.
create table if not exists ui_components (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in (
    'botones', 'hero', 'testimonios', 'prueba-social', 'formularios', 'precios',
    'faq', 'cta', 'navegacion', 'footer', 'tarjetas', 'listas', 'contadores',
    'media', 'fondos', 'animaciones', 'otros'
  )),
  description text,
  code text,
  code_language text not null default 'tsx' check (code_language in ('tsx', 'jsx', 'html', 'css', 'js', 'otro')),
  prompt text,
  install_command text,
  reference_url text,
  preview_url text,
  tags text[] not null default '{}',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ui_components_category_idx on ui_components (category);

alter table ui_components enable row level security;

insert into ui_components (title, category, description, code_language, install_command)
select
  'Task list (rare-ui)',
  'listas',
  'Lista de tareas animada de rare-ui. Instalar con el comando de shadcn.',
  'tsx',
  'npx shadcn@latest add swamimalode07/rare-ui/task-list'
where not exists (select 1 from ui_components where title = 'Task list (rare-ui)');

-- Rollback: drop table if exists ui_components;
