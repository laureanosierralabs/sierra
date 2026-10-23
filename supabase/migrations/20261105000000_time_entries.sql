-- Tabla de horas del equipo: cada persona carga el día, la hora de comienzo,
-- la de finalización y qué hizo. Las horas se calculan (no se cargan a mano)
-- para que el total nunca contradiga el horario.
--
-- `user_id` es el id de Clerk de quien cargó la fila; `user_name` se guarda al
-- cargar para listar sin pedirle a Clerk cada nombre. El cliente es opcional:
-- sirve para filtrar las horas de un trabajo (por ejemplo, las de Wonder).
--
-- Rollback:
--   drop table time_entries;

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null,
  client_id uuid references clients(id) on delete set null,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  minutes integer generated always as (
    (extract(epoch from (end_time - start_time)) / 60)::integer
  ) stored,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (char_length(notes) <= 2000)
);

create index if not exists time_entries_user_date_idx on time_entries (user_id, work_date desc);
create index if not exists time_entries_date_idx on time_entries (work_date desc);

alter table time_entries enable row level security;
revoke all on table time_entries from public, anon, authenticated;
grant all on table time_entries to service_role;
