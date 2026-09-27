-- Historial de cobros: cada pago es una fila con su fecha.
--
-- amount_paid era un acumulado que había que recalcular a mano en cada cobro
-- ("ya tenía 675, entraron 675, pongo 1350") y no dejaba rastro de cuándo
-- entró cada parte. Con "2 pagos" como condición habitual eso se vuelve
-- imposible de auditar.
--
-- Desde acá amount_paid pasa a ser derivado: lo mantiene un trigger sumando
-- los pagos. Así el acumulado y el historial no pueden contradecirse.

create table if not exists quote_payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_on date not null,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists quote_payments_quote_id_idx on quote_payments (quote_id);

alter table quote_payments enable row level security;

-- Migra el acumulado que ya estaba cargado. La fecha real de esos cobros no
-- se conoce, así que se usa la de creación de la cotización: es lo más
-- cercano a la verdad sin inventar un dato.
--
-- El `not exists` hace falta porque la PK es un uuid generado: un `on
-- conflict do nothing` no detecta nada y correr esto dos veces duplicaría
-- cada cobro.
insert into quote_payments (quote_id, amount, paid_on, notes)
select q.id, q.amount_paid, q.created_at::date, 'Cobro registrado antes del historial'
from quotes q
where q.amount_paid > 0
  and not exists (
    select 1 from quote_payments p where p.quote_id = q.id
  );

-- amount_paid queda como espejo de la suma de pagos.
create or replace function recalcular_amount_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  objetivo uuid := coalesce(new.quote_id, old.quote_id);
begin
  update quotes q
  set amount_paid = coalesce(
        (select sum(p.amount) from quote_payments p where p.quote_id = objetivo),
        0
      ),
      updated_at = now()
  where q.id = objetivo;
  return null;
end;
$$;

drop trigger if exists quote_payments_recalcular on quote_payments;

create trigger quote_payments_recalcular
after insert or update or delete on quote_payments
for each row execute function recalcular_amount_paid();
