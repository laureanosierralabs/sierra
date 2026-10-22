-- Propuesta: lo que convierte una cotización en algo que vende.
--
--   quotes.includes       "Este servicio incluye": lista de textos.
--   quotes.faq            "Importantes": preguntas con su respuesta.
--   quotes.delivery_time  "Tiempo de entrega": texto libre ("7 a 10 días hábiles").
--   quote_library         Biblioteca de "incluye" y preguntas predefinidas:
--                         se tildan en cada cotización. Cada cotización guarda
--                         su propia copia, así editar la biblioteca no cambia
--                         lo que ya se mandó.
--
-- Rollback:
--   alter table quotes drop column includes, drop column faq, drop column delivery_time;
--   drop table quote_library;

alter table quotes
  add column if not exists includes jsonb not null default '[]'::jsonb,
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists delivery_time text;

alter table quotes drop constraint if exists quotes_includes_array;
alter table quotes add constraint quotes_includes_array check (jsonb_typeof(includes) = 'array');
alter table quotes drop constraint if exists quotes_faq_array;
alter table quotes add constraint quotes_faq_array check (jsonb_typeof(faq) = 'array');
alter table quotes drop constraint if exists quotes_delivery_time_len;
alter table quotes add constraint quotes_delivery_time_len check (delivery_time is null or length(delivery_time) <= 80);

create table if not exists quote_library (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('incluye', 'pregunta')),
  title text not null check (length(trim(title)) between 1 and 300),
  -- Respuesta de una pregunta; null en un "incluye".
  body text check (body is null or length(body) <= 2000),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quote_library_kind_idx on quote_library (kind, position);
alter table quote_library enable row level security;

-- Punto de partida: los textos de las cotizaciones que ya se mandaban en PDF.
-- Solo si la biblioteca está vacía (correrla dos veces no duplica).
do $$
begin
  if not exists (select 1 from quote_library) then
    insert into quote_library (kind, title, body, position) values
      ('incluye', 'Diseño personalizado con la marca', null, 1),
      ('incluye', 'Prototipo de cada landing', null, 2),
      ('incluye', 'Landing de ventas con diseño personalizado y orientado a conversión', null, 3),
      ('incluye', 'Diseño de oferta irresistible con mockups', null, 4),
      ('incluye', 'Página de confirmación de compra', null, 5),
      ('incluye', 'Conexiones y enlaces iniciales', null, 6),
      ('incluye', 'Integración del checkout de Stripe con GHL', null, 7),
      ('incluye', 'Registro automático de compradores en el CRM de GHL', null, 8),
      ('incluye', 'Automatización y creación del email de bienvenida con acceso a grupo de WhatsApp', null, 9),
      ('incluye', 'Configuración de analítica para medir visitas, clics y compras', null, 10),
      ('incluye', 'Montaje de la página en Elementor + WordPress o Go High Level', null, 11),
      ('incluye', 'Adaptación responsive para todos los dispositivos', null, 12),
      ('incluye', 'Optimización web', null, 13),
      ('incluye', 'Configuración de infraestructura y publicación', null, 14),
      ('incluye', 'Pruebas de funcionamiento de todo el recorrido de compra', null, 15),
      ('incluye', 'Entregables (recursos creados y utilizados)', null, 16),
      ('incluye', 'Licencias de Elementor Pro y WP Rocket incluidas por 1 año', null, 17),
      ('incluye', 'Soporte durante el lanzamiento', null, 18),
      ('pregunta', '¿Cuánto tiempo tardará en realizarse el proyecto?',
        'Lo indicado en el tiempo de entrega, contado desde el momento en que nos pasen todo el material que necesitamos.', 1),
      ('pregunta', '¿Cómo son las formas de pago?',
        'Para comenzar, el 50% del valor del proyecto, y el 50% restante cuando el proyecto esté listo y aprobado.', 2),
      ('pregunta', '¿Qué métodos de pago manejan?',
        'Manejamos una pasarela de pago llamada Payoneer: por ahí podés pagar con tarjeta de débito y crédito, Visa o Mastercard. También recibimos pagos en USDT.', 3),
      ('pregunta', '¿Qué necesitamos de su parte?',
        E'Fotografías en alta calidad\nLinks o enlaces que se colocarán en los botones (por ejemplo, el de WhatsApp)\nAccesos al hosting y al proveedor de dominios (si no los tenés, te ayudamos a obtenerlos)\nContenido para la sección de testimonios', 4);
  end if;
end $$;
