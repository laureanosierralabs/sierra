-- Portal de clientes, fase 1: cada cliente con acceso al portal tiene una
-- Organización de Clerk. Esta tabla las une: la organización es la identidad
-- (quién entra y con qué rol), el cliente es el dato (qué ve).
--
-- Un cliente tiene a lo sumo una organización y una organización pertenece a
-- un solo cliente. El slug no se guarda: vive en Clerk y puede cambiar; el
-- portal resuelve por id de organización.
--
-- Rollback: drop table client_orgs; (solo borra vínculos; las organizaciones
-- de Clerk quedan y se pueden borrar desde su dashboard).

create table if not exists client_orgs (
  client_id uuid primary key references clients(id) on delete cascade,
  clerk_org_id text not null unique,
  created_at timestamptz not null default now()
);

alter table client_orgs enable row level security;

-- Igual que las tablas de finanzas: solo la service role. Las políticas por
-- organización llegan en la fase 2, junto con el acceso desde el portal.
revoke all on table client_orgs from public, anon, authenticated;
grant all on table client_orgs to service_role;
