-- Clientes destacados: los fijados van primero en la lista de clientes, en el
-- orden en que se fijaron. Null = no destacado.
alter table clients add column if not exists pinned_at timestamptz;

-- Rollback: alter table clients drop column if exists pinned_at;
