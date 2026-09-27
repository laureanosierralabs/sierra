-- Fecha de inicio del proyecto.
--
-- Hasta ahora solo existía due_date, así que en el calendario un proyecto
-- era un punto suelto: se veía cuándo vence, no cuánto dura ni cuándo
-- arranca. Con las dos fechas se dibuja como una barra y se ve de un vistazo
-- qué proyectos se superponen.
--
-- Nullable a propósito: los proyectos que ya existen no tienen este dato y
-- ponerles una fecha inventada sería peor que dejarlo vacío. El formulario
-- la exige solo al crear uno nuevo.

alter table projects
  add column if not exists start_date date;
