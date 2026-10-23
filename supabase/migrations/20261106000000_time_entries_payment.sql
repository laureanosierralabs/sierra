-- 1) Cada carga de horas puede quedar vinculada al pago (team_payments) que la
--    cubrió. Así Horas muestra qué está pagado y qué no, y el pago vive en
--    Finanzas como egreso del equipo. Si se borra el pago, las horas vuelven a
--    quedar pendientes (on delete set null).
--
-- 2) Una carga puede cruzar la medianoche (23:20 → 05:50 = 6,5 h): si la hora
--    de finalización es menor que la de comienzo, termina al día siguiente.
--    Tope de 16 h por carga, para que un horario tipeado al revés (20:00 →
--    16:00) no se convierta en 20 horas.
--
-- Rollback:
--   alter table time_entries drop constraint time_entries_horario_check;
--   alter table time_entries alter column minutes set expression as
--     ((extract(epoch from (end_time - start_time)) / 60)::integer);
--   alter table time_entries add constraint time_entries_check check (end_time > start_time);
--   alter table time_entries drop column team_payment_id;

alter table time_entries
  add column if not exists team_payment_id uuid references team_payments(id) on delete set null;

create index if not exists time_entries_payment_idx on time_entries (team_payment_id);

alter table time_entries drop constraint if exists time_entries_check;

alter table time_entries alter column minutes set expression as (
  ((extract(epoch from (end_time - start_time)) / 60)::integer + 1440) % 1440
);

alter table time_entries add constraint time_entries_horario_check check (
  end_time <> start_time
  and ((extract(epoch from (end_time - start_time)) / 60)::integer + 1440) % 1440 <= 960
);
