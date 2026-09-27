-- Fecha propia en los acuerdos y gastos fijos recurrentes.
--
-- created_at es cuándo se cargó el dato, no cuándo pasó el hecho: todas las
-- cotizaciones dicen 27/09 porque se cargaron ese día, aunque el trabajo sea
-- de julio. Para un balance mensual eso miente, así que hace falta una fecha
-- del acuerdo, editable.
--
-- El balance de caja se arma con las fechas de los pagos (paid_on), que sí
-- son reales. agreed_on sirve para saber cuándo se comprometió la plata.

alter table team_agreements
  add column if not exists agreed_on date;

-- Los acuerdos ya cargados toman la fecha de su primer pago, que es el dato
-- real más cercano. Los que no tienen pagos quedan sin fecha antes que con
-- una inventada.
update team_agreements a
set agreed_on = (
  select min(p.paid_on) from team_payments p where p.agreement_id = a.id
)
where a.agreed_on is null;

-- Gastos que se repiten: suscripciones y herramientas. No se carga uno por
-- mes a mano; se declara el gasto y su periodicidad, y el balance lo proyecta.
create table if not exists fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD','ARS','EUR')),
  -- Un gasto anual pesa distinto que uno mensual: el balance lo prorratea.
  period text not null default 'monthly' check (period in ('monthly','yearly')),
  category text not null default 'herramienta'
    check (category in ('herramienta','suscripcion','infraestructura','impuesto','otro')),
  -- Desde cuándo corre y hasta cuándo. active_until null = sigue vigente.
  active_from date not null,
  active_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fixed_expenses_active_idx
  on fixed_expenses (active_from, active_until);

alter table fixed_expenses enable row level security;
