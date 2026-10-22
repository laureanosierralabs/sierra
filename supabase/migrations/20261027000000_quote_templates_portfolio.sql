-- Plantillas de cotización y portfolio de las propuestas.
--
--   quote_templates   Una cotización "modelo" por tipo de servicio (funnel de
--                     lanzamiento, embudo de registro, sitio web): sus ítems,
--                     lo que incluye, las preguntas, el plazo y el diagrama.
--                     Se usa para crear una cotización nueva ya armada.
--   portfolio_items   Trabajos que se muestran al pie de las propuestas.
--   quotes.show_portfolio  Mostrar (o no) el portfolio en esa cotización.
--
-- Rollback:
--   drop table quote_templates; drop table portfolio_items;
--   alter table quotes drop column show_portfolio;

create table if not exists quote_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  service text check (service is null or length(service) <= 200),
  currency text not null default 'USD',
  -- Con ítems, la diferencia entre su suma y el total es el descuento por paquete.
  total_amount numeric(12,2) check (total_amount is null or total_amount >= 0),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  includes jsonb not null default '[]'::jsonb check (jsonb_typeof(includes) = 'array'),
  faq jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),
  funnel jsonb not null default '[]'::jsonb check (jsonb_typeof(funnel) = 'array'),
  delivery_time text check (delivery_time is null or length(delivery_time) <= 80),
  payment_terms text check (payment_terms is null or length(payment_terms) <= 300),
  created_at timestamptz not null default now()
);

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 60),
  image_url text not null check (image_url ~* '^https?://'),
  link text check (link is null or link ~* '^https?://'),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table quotes add column if not exists show_portfolio boolean not null default true;

alter table quote_templates enable row level security;
alter table portfolio_items enable row level security;
