-- Cada acuerdo con el equipo puede quedar vinculado a la cuenta de la persona
-- (su usuario de Clerk). Con el vínculo, esa persona ve en "Mis cobros" lo
-- que tiene acordado, lo que se le pagó y lo que falta.
--
-- `member_name` se queda: es el nombre que se muestra y sirve para quien no
-- tiene cuenta en el panel (se le paga igual, solo que no ve sus cobros).
-- Texto sin FK, igual que los asignados de proyectos y tareas: los usuarios
-- viven en Clerk, no en la base.
--
-- Rollback: alter table team_agreements drop column member_user_id;

alter table team_agreements
  add column if not exists member_user_id text;

create index if not exists team_agreements_member_user_idx
  on team_agreements (member_user_id)
  where member_user_id is not null;
