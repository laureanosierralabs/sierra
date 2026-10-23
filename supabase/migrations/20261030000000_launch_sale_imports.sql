-- Ventas importadas de otra herramienta (GoHighLevel, por etiqueta de contacto)
-- para lanzamientos que se vendieron fuera del kit del panel. Se sabe QUIÉN
-- compró, pero a veces no CUÁNDO, y el monto es el precio de lista, no lo que
-- realmente se cobró (sin cupones ni reembolsos). Por eso no van en
-- site_conversions, que exige fecha y monto real.
--
-- `occurred_at` null = se sabe que compró, no cuándo: cuenta en los totales
-- pero no aparece en el gráfico por día. `list_price` marca que el monto es el
-- de lista, para rotularlo así en el panel.
--
-- Cada fila cuelga de la landing (no de un launch_id propio): si una landing
-- cambia de lanzamiento, sus ventas importadas la siguen.
--
-- Rollback:
--   drop table launch_sale_imports;

create table if not exists launch_sale_imports (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references launch_pages(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  -- Identifica a quien compró en la herramienta de origen, p. ej. 'ghl:<contactId>'.
  external_id text not null,
  occurred_at timestamptz,
  amount numeric(12,2),
  currency text,
  list_price boolean not null default true,
  source text not null check (source in ('ghl')),
  created_at timestamptz not null default now(),
  -- Reimportar a la misma persona no duplica.
  unique (page_id, external_id)
);

create index if not exists launch_sale_imports_page_idx on launch_sale_imports (page_id);
create index if not exists launch_sale_imports_client_idx on launch_sale_imports (client_id);

alter table launch_sale_imports enable row level security;
revoke all on table launch_sale_imports from public, anon, authenticated;
grant all on table launch_sale_imports to service_role;
