-- PDF de la propuesta subido a Storage (bucket privado "propuestas").
-- proposal_url se conserva para las propuestas que viven en Drive.

alter table quotes
  add column if not exists document_path text;
