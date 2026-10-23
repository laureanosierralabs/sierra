-- Reporte diario del lanzamiento por mail al cliente + resumen final.
--   * daily_report: el owner lo prende en Configuración. El cron
--     (/api/cron/reportes, 9:00 hora de Argentina) manda un resumen por día
--     mientras el lanzamiento está activo y un resumen final al terminar.
--   * report_recipients: a quién va (emails en minúscula, sin repetir, máx. 10).
--   * last_daily_report_on: último día (hora de Buenos Aires) en que se mandó
--     el diario; evita mandarlo dos veces el mismo día.
--   * final_report_sent_at: cuándo salió el resumen final; null = pendiente.
--
-- Son datos del owner: NO van en la lista de columnas del portal
-- (COLUMNAS_LANZAMIENTO). Se leen solo con el helper del panel / el cron.
-- Sin políticas nuevas: la tabla ya es de acceso solo por service-role.
--
-- Rollback:
--   alter table launches
--     drop column final_report_sent_at,
--     drop column last_daily_report_on,
--     drop column report_recipients,
--     drop column daily_report;

alter table launches
  add column if not exists daily_report boolean not null default false,
  add column if not exists report_recipients text[] not null default '{}',
  add column if not exists last_daily_report_on date,
  add column if not exists final_report_sent_at timestamptz;
