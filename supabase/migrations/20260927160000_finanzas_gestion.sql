-- Finanzas de gestión: categorías de gasto y periodicidad única.
--
-- "Servicio" faltaba como categoría (un contador, un dominio gestionado por
-- un tercero no son ni herramienta ni infraestructura).
--
-- "once" es un gasto de una sola vez. No se prorratea: pesa entero en el mes
-- en que ocurrió y no entra en el gasto fijo mensual, porque no se repite.

alter table fixed_expenses drop constraint if exists fixed_expenses_category_check;

alter table fixed_expenses
  add constraint fixed_expenses_category_check
  check (category in ('herramienta','suscripcion','infraestructura','servicio','impuesto','otro'));

alter table fixed_expenses drop constraint if exists fixed_expenses_period_check;

alter table fixed_expenses
  add constraint fixed_expenses_period_check
  check (period in ('monthly','yearly','once'));

-- allocated_amount ya existe en quote_projects desde la migración de
-- cotizaciones. Se documenta acá porque recién ahora se vuelve editable:
-- es cuánto de una cotización corresponde a cada proyecto que cubre.
-- Sigue siendo nullable a propósito — repartir un total entre proyectos es
-- una decisión del negocio, no un promedio automático.
comment on column quote_projects.allocated_amount is
  'Ingreso atribuible a este proyecto dentro de la cotización. Null = sin asignar: la rentabilidad del proyecto no se calcula en vez de inventar un reparto.';

-- NOTA SOBRE CLIENTES (no se migra nada acá, solo se deja constancia):
--
-- clients.name guarda una PERSONA y clients.company la CUENTA comercial.
-- Hoy hay dos empresas con dos contactos cada una, cada uno como fila
-- separada, así que la facturación de una misma cuenta aparece partida:
--   Volver al Origen      <- Pilar Sousa, Ismael El Haddar
--   Wonder Digital Agency <- Rodrigo Descalzo, Victoria Cercone
--
-- La separación correcta sería una tabla accounts y clients pasando a ser
-- contactos que apuntan a ella. Mientras tanto, la rentabilidad por cliente
-- agrupa por company cuando existe, que da el número correcto sin tocar
-- los datos.
comment on column clients.company is
  'Cuenta comercial. Varias filas de clients pueden compartirla: name es la persona de contacto, no la cuenta.';
