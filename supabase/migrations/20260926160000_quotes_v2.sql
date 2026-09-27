-- Cotizaciones v2: una cotización puede cubrir varios proyectos.
--
-- El modelo viejo ataba la cotización al proyecto con projects.quote_id, que
-- solo admite una por proyecto y no deja que una cotización cubra a varios.
-- Se reemplaza por quote_projects (muchos a muchos), que además deja la puerta
-- abierta a que un proyecto acumule cotizaciones (ampliación de alcance).
--
-- La tabla quotes está vacía, así que el renombre de columnas no migra datos.

-- Estado comercial y estado de pago son ejes independientes: una cotización
-- aprobada puede estar impaga, y una rechazada nunca llega a cobrarse.
alter table quotes rename column amount to total_amount;
alter table quotes rename column status to commercial_status;

alter table quotes drop constraint if exists quotes_status_check;

alter table quotes
  add constraint quotes_commercial_status_check
  check (commercial_status in ('draft','sent','approved','rejected','cancelled'));

alter table quotes alter column commercial_status set default 'draft';

alter table quotes
  add column if not exists payment_status text not null default 'not_applicable'
    check (payment_status in ('not_applicable','pending','partial','paid')),
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists payment_terms text;

-- Número legible para la interfaz. El uuid sigue siendo la clave real; esto
-- es solo para poder nombrar una cotización en voz alta ("la COT-0004").
create sequence if not exists quotes_numero_seq;

alter table quotes
  add column if not exists numero integer not null default nextval('quotes_numero_seq');

create unique index if not exists quotes_numero_idx on quotes (numero);

create table if not exists quote_projects (
  quote_id uuid not null references quotes(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  -- Nullable a propósito: repartir el total entre los proyectos es una
  -- decisión manual, no un promedio. Una cotización de 1800 por tres
  -- proyectos no significa 600 cada uno.
  allocated_amount numeric(12,2),
  created_at timestamptz not null default now(),
  primary key (quote_id, project_id)
);

create index if not exists quote_projects_project_id_idx on quote_projects (project_id);

alter table quote_projects enable row level security;

-- Migra el vínculo simple que ya existiera a la tabla puente.
insert into quote_projects (quote_id, project_id)
select quote_id, id from projects
where quote_id is not null
on conflict do nothing;
