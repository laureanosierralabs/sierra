-- Diagrama del embudo de una cotización: la secuencia de pasos que se dibuja
-- en el documento (páginas como celulares, integraciones como Stripe o
-- WhatsApp, y separadores entre flujos). Lista de { tipo, etiqueta? }.
--
-- Rollback:
--   alter table quotes drop column funnel;

alter table quotes
  add column if not exists funnel jsonb not null default '[]'::jsonb;

alter table quotes drop constraint if exists quotes_funnel_array;
alter table quotes add constraint quotes_funnel_array check (jsonb_typeof(funnel) = 'array');
