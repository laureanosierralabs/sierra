-- Enlaces de un lanzamiento: dónde puso el cliente el link del webinar y el del
-- grupo de WhatsApp, y cuándo se usó por última vez el del grupo.
--
-- `launch_link_placements` es la lista "Dónde lo pusiste": una fila por lugar
-- tildado (quién y cuándo). Destildar borra la fila.
-- `launches.group_last_used_at` lo actualiza /g/<token> en cada entrada
-- contada (no bots); el webinar ya tiene su señal en launch_events.
--
-- Rollback:
--   drop table launch_link_placements;
--   alter table launches drop column group_last_used_at;

create table if not exists launch_link_placements (
  launch_id uuid not null references launches(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  link text not null check (link in ('webinar', 'grupo')),
  placement text not null check (placement in ('mail-registro', 'recordatorios', 'pagina-gracias', 'whatsapp-redes')),
  checked_by text,
  checked_at timestamptz not null default now(),
  primary key (launch_id, link, placement)
);

create index if not exists launch_link_placements_client_id_idx on launch_link_placements (client_id);

alter table launch_link_placements enable row level security;
revoke all on table launch_link_placements from public, anon, authenticated;
grant all on table launch_link_placements to service_role;

alter table launches add column if not exists group_last_used_at timestamptz;
