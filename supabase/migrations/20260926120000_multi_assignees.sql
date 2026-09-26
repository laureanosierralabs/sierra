-- Un proyecto o una tarea puede tener varios responsables, no solo uno.
-- Se reemplaza responsible_user_id/assigned_to (columnas de un solo valor)
-- por tablas puente. Las columnas viejas quedan de momento como fallback
-- de lectura; se borran en una migración posterior una vez migrada la UI.

create table if not exists project_assignees (
  project_id uuid not null references projects(id) on delete cascade,
  user_id text not null,
  primary key (project_id, user_id)
);

create table if not exists task_assignees (
  task_id uuid not null references tasks(id) on delete cascade,
  user_id text not null,
  primary key (task_id, user_id)
);

create index if not exists project_assignees_project_id_idx on project_assignees (project_id);
create index if not exists task_assignees_task_id_idx on task_assignees (task_id);

alter table project_assignees enable row level security;
alter table task_assignees enable row level security;

-- Migra el responsable único existente a la tabla puente.
insert into project_assignees (project_id, user_id)
select id, responsible_user_id from projects
where responsible_user_id is not null
on conflict do nothing;

insert into task_assignees (task_id, user_id)
select id, assigned_to from tasks
where assigned_to is not null
on conflict do nothing;
