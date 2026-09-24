-- Suma 'stand-by' a los estados de proyecto: frenado por decisión propia,
-- distinto de 'esperando-cliente' donde la pelota la tiene un tercero.
-- Aditiva: los estados existentes siguen siendo válidos.

alter table projects drop constraint if exists projects_status_check;

alter table projects add constraint projects_status_check
  check (status in (
    'por-iniciar',
    'en-progreso',
    'en-revision',
    'esperando-cliente',
    'stand-by',
    'entregado'
  ));
