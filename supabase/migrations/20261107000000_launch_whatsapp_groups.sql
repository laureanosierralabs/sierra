-- Grupos de WhatsApp rotativos por lanzamiento.
--
-- Cada lanzamiento tiene UN link fijo (`<landing>/grupo/<group_token>`) que se
-- pega una sola vez en la página de gracias y en los mails. El panel lo manda
-- al grupo vigente: el primero (por `position`) que no está lleno. Un grupo se
-- llena solo al llegar a `cap` personas, o a mano ("marcar lleno").
--
-- `launch_group_joins` anota a quién se mandó a cada grupo. Una persona (por
-- email) queda en un solo grupo por lanzamiento: si vuelve a abrir el link, va
-- al mismo. Sin email, cada clic cuenta como una persona: el grupo se da por
-- lleno antes de tiempo, nunca después.
--
-- Rollback:
--   drop table launch_group_joins;
--   drop table launch_whatsapp_groups;
--   drop function sumar_join_grupo();
--   alter table launches drop column group_token;

alter table launches
  add column if not exists group_token text not null default replace(gen_random_uuid()::text, '-', '');

create unique index if not exists launches_group_token_idx on launches (group_token);

create table if not exists launch_whatsapp_groups (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references launches(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  url text not null check (url ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$'),
  position integer not null,
  cap integer not null default 900 check (cap between 1 and 1024),
  joins integer not null default 0,
  full_at timestamptz,
  -- Cuándo se avisó que se llenó: solo una request avisa, aunque lleguen juntas.
  alerted_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  unique (launch_id, url)
);

create index if not exists launch_whatsapp_groups_launch_idx on launch_whatsapp_groups (launch_id, position);
create index if not exists launch_whatsapp_groups_client_idx on launch_whatsapp_groups (client_id);

create table if not exists launch_group_joins (
  id bigint generated always as identity primary key,
  launch_id uuid not null references launches(id) on delete cascade,
  group_id uuid not null references launch_whatsapp_groups(id) on delete cascade,
  persona text not null,
  email text,
  day date not null,
  occurred_at timestamptz not null default now(),
  unique (launch_id, persona)
);

create index if not exists launch_group_joins_group_idx on launch_group_joins (group_id);

-- El contador vive en el grupo: elegir el vigente es una sola lectura. El
-- grupo se cierra acá, en la misma fila que suma: con muchas entradas a la
-- vez (un envío masivo) nadie lee un conteo viejo y el cierre no se pierde.
create or replace function sumar_join_grupo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update launch_whatsapp_groups
  set joins = joins + 1,
      full_at = case when full_at is null and joins + 1 >= cap then now() else full_at end
  where id = new.group_id;
  return null;
end;
$$;

drop trigger if exists launch_group_joins_contar on launch_group_joins;
create trigger launch_group_joins_contar
  after insert on launch_group_joins
  for each row execute function sumar_join_grupo();

alter table launch_whatsapp_groups enable row level security;
alter table launch_group_joins enable row level security;
revoke all on table launch_whatsapp_groups, launch_group_joins from public, anon, authenticated;
grant all on table launch_whatsapp_groups, launch_group_joins to service_role;
revoke all on function sumar_join_grupo() from public, anon, authenticated;
