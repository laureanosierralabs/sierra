-- Costos de equipo: lo que se le paga a quien ejecuta el trabajo.
--
-- Es el espejo de quotes. Un acuerdo con Bruno puede cubrir varias landings
-- (400 por Misión Origen + Game) y pagarse en partes, igual que una
-- cotización. Se reusa la misma forma en vez de inventar otra: así el margen
-- de un proyecto es restar dos números que viven en estructuras gemelas.
--
-- Un acuerdo sin proyectos vinculados es trabajo por horas (mantenimiento,
-- cambios sueltos). No se registran las horas — eso sigue en el Excel de
-- quien las trabaja — solo lo que se paga.

create table if not exists team_agreements (
  id uuid primary key default gen_random_uuid(),
  numero integer not null,
  -- Nombre libre, no un user de Clerk: se le paga a gente que no
  -- necesariamente tiene cuenta en el panel.
  member_name text not null,
  title text not null,
  total_amount numeric(12,2),
  currency text not null default 'USD' check (currency in ('USD','ARS','EUR')),
  amount_paid numeric(12,2) not null default 0,
  payment_status text not null default 'pending'
    check (payment_status in ('pending','partial','paid')),
  payment_terms text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists team_agreements_numero_seq;

alter table team_agreements
  alter column numero set default nextval('team_agreements_numero_seq');

create unique index if not exists team_agreements_numero_idx
  on team_agreements (numero);

create table if not exists agreement_projects (
  agreement_id uuid not null references team_agreements(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agreement_id, project_id)
);

create index if not exists agreement_projects_project_id_idx
  on agreement_projects (project_id);

create table if not exists team_payments (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references team_agreements(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_on date not null,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists team_payments_agreement_id_idx
  on team_payments (agreement_id);

alter table team_agreements enable row level security;
alter table agreement_projects enable row level security;
alter table team_payments enable row level security;

-- Mismo criterio que en cobros: amount_paid es espejo de la suma de pagos,
-- no un número que se actualiza a mano.
create or replace function recalcular_team_amount_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  objetivo uuid := coalesce(new.agreement_id, old.agreement_id);
  pagado numeric(12,2);
  total numeric(12,2);
begin
  select coalesce(sum(p.amount), 0) into pagado
  from team_payments p where p.agreement_id = objetivo;

  select a.total_amount into total
  from team_agreements a where a.id = objetivo;

  update team_agreements
  set amount_paid = pagado,
      payment_status = case
        when pagado <= 0 then 'pending'
        when total is not null and pagado >= total then 'paid'
        else 'partial'
      end,
      updated_at = now()
  where id = objetivo;

  return null;
end;
$$;

drop trigger if exists team_payments_recalcular on team_payments;

create trigger team_payments_recalcular
after insert or update or delete on team_payments
for each row execute function recalcular_team_amount_paid();
