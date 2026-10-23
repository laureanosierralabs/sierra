-- Reporte final con análisis de IA, aprobado por el owner antes de salir, y
-- aviso de meta alcanzada.
--   * final_draft: borrador del análisis final (lo genera la IA al terminar el
--     lanzamiento o el owner a mano; el owner lo edita y lo aprueba). Al
--     aprobar, el texto también pasa a closing_notes y se manda al cliente.
--   * final_draft_at: cuándo se generó el borrador.
--   * goal_notified_at: cuándo se avisó que se llegó a la meta de registros
--     (goal_registrations); null = todavía no se avisó. Evita avisar dos veces.
--
-- Son datos del owner: NO van en la lista de columnas del portal
-- (COLUMNAS_LANZAMIENTO). Se leen solo con el helper del panel / el cron.
-- Sin políticas nuevas: la tabla ya es de acceso solo por service-role.
--
-- Rollback:
--   alter table launches
--     drop column goal_notified_at,
--     drop column final_draft_at,
--     drop column final_draft;

alter table launches
  add column if not exists final_draft text,
  add column if not exists final_draft_at timestamptz,
  add column if not exists goal_notified_at timestamptz;
