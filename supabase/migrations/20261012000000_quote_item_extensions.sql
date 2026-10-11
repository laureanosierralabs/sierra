-- Extensiones de ítem: una integración o automatización que se cotiza
-- colgada de un ítem (por ejemplo, "Integración con GHL" bajo la página de
-- Lista de Espera). Se muestra indentada debajo de su ítem en el documento.
--
-- No hay FK al ítem padre: los ítems se reemplazan enteros al guardar, así
-- que una extensión pertenece al ítem principal que la precede por posición.
-- Hereda el proyecto de ese ítem (lo resuelve guardarCotizacion).
--
-- El precio de paquete no necesita columna: con ítems, si total_amount es
-- menor que la suma de los ítems, la diferencia es la bonificación.

alter table quote_items
  add column if not exists is_extension boolean not null default false;
