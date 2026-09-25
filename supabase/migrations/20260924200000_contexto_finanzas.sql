-- Contexto y finanzas pasan del filesystem a la base.
-- En Vercel el disco es de solo lectura y efímero: leer y escribir .md/.json
-- funciona en local pero rompe en producción.

create table if not exists context_units (
  slug text primary key,
  nombre text not null,
  estado text,
  que_es text,
  como_se_opera text,
  recursos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists context_projects (
  slug text primary key,
  unidad text not null references context_units(slug) on delete cascade,
  nombre text not null,
  cliente text,
  estado text not null default 'activo',
  prioridad text not null default 'media',
  responsables jsonb not null default '[]'::jsonb,
  entrega date,
  actualizado date,
  proximo_paso text,
  bloqueos jsonb not null default '[]'::jsonb,
  estado_actual text,
  recursos jsonb not null default '[]'::jsonb,
  decisiones jsonb not null default '[]'::jsonb,
  bitacora jsonb not null default '[]'::jsonb,
  notas text,
  updated_at timestamptz not null default now()
);

create table if not exists context_clients (
  slug text primary key,
  unidad text not null references context_units(slug) on delete cascade,
  nombre text not null,
  estado text,
  canal text,
  contexto text,
  esperando_respuesta jsonb not null default '[]'::jsonb,
  recursos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Reemplaza finanzas/movimientos.json
create table if not exists movements (
  id text primary key,
  fecha date not null,
  ambito text not null check (ambito in ('negocio','personal')),
  tipo text not null check (tipo in ('ingreso','egreso')),
  monto numeric(14,2) not null,
  moneda text not null check (moneda in ('ARS','USD')),
  categoria text not null default 'otro',
  concepto text not null,
  unidad text,
  cliente text,
  proyecto text,
  persona text,
  estado text not null check (estado in ('pagado','pendiente','cobrado')),
  comprobante text,
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists movements_ambito_fecha_idx
  on movements (ambito, fecha desc);
create index if not exists context_projects_unidad_idx
  on context_projects (unidad);
create index if not exists context_clients_unidad_idx
  on context_clients (unidad);

alter table context_units enable row level security;
alter table context_projects enable row level security;
alter table context_clients enable row level security;
alter table movements enable row level security;
