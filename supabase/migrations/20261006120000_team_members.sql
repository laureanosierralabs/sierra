-- Personal operating directory, independent from Clerk accounts and costs.
begin;

create table if not exists team_members (
  id text primary key,
  name text not null check (length(trim(name)) between 1 and 120),
  role text not null check (length(trim(role)) between 1 and 200),
  responsibilities text not null default '',
  autonomous_decisions text not null default '',
  approval_required text not null default '',
  status text check (status in ('disponible', 'trabajando', 'bloqueado', 'esperando-aprobacion')),
  project_ids uuid[] not null default '{}',
  context_project_slugs text[] not null default '{}',
  does text not null default '',
  delegates text not null default '',
  approves text not null default '',
  monitors text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Server-side owner authorization + service role, as in the existing tables.
alter table team_members enable row level security;

-- Rerunning this migration never replaces edited profiles or assignments.
insert into team_members (id, name, role, does, delegates, approves, monitors)
values
  ('laureano', 'Laureano', 'Dirección / Growth / Producto',
   E'Ventas\nOferta\nPricing\nDirección estratégica\nProducto\nContratación\nDecisiones financieras\nRelaciones importantes con clientes\nDirección de proyectos importantes\nContenido donde necesito aparecer yo',
   E'Diseño\nDesarrollo\nImplementación\nResponsive\nEdición\nProducción de contenido\nTareas operativas repetitivas\nQA inicial',
   E'Dirección visual importante\nEntregables clave\nCambios de alcance\nLanzamientos finales\nDecisiones sensibles de cliente',
   E'Deadlines\nEstado de proyectos\nEquipo\nCostos\nMargen\nCobros\nBloqueos'),
  ('bruno', 'Bruno', 'Responsable Operativo Web', '', '', '', ''),
  ('ulises', 'Ulises', 'Operador Web', '', '', '', ''),
  ('cielo', 'Cielo', 'Operaciones Marca Personal', '', '', '', ''),
  ('jeremias', 'Jeremías', 'Dirección Técnica Synous', '', '', '', '')
on conflict (id) do nothing;

commit;
