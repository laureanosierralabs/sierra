-- Transcripciones y notas de reuniones del cliente (Fathom, etc).

create table if not exists client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  -- Link a la grabación/transcripción original.
  url text,
  -- Texto pegado de la transcripción, si se quiere tener acá.
  body text,
  meeting_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_notes_client_idx
  on client_notes (client_id, meeting_date desc);

alter table client_notes enable row level security;
