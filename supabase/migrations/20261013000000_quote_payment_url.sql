-- Link de pago de la cotización (Stripe, Mercado Pago, PayPal...). Se muestra
-- como botón "Pagar" en el link público y como link en el PDF, para que el
-- cliente pague desde la misma cotización.

alter table quotes
  add column if not exists payment_url text;
