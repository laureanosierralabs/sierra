/**
 * Piezas puras de la sincronización con GoHighLevel (sin red ni base): la
 * ventana de fechas del lanzamiento, el filtro de contactos de prueba y el
 * paso de contacto a fila de `launch_sale_imports`. Aparte de ghl.ts para
 * poder probarlas con node:test.
 */

export interface ContactoGhl {
  id: string;
  email?: string | null;
  tags?: string[] | null;
  source?: string | null;
  dateAdded?: string | null;
}

export interface MapeoVenta {
  tag: string;
  page_id: string;
  amount: number | null;
  currency: string;
}

export interface VentanaLanzamiento {
  starts_on: string | null;
  ends_on: string | null;
}

export interface FilaVenta {
  page_id: string;
  client_id: string;
  external_id: string;
  occurred_at: string | null;
  amount: number | null;
  currency: string;
  list_price: true;
  source: "ghl";
}

/** Día calendario (AAAA-MM-DD) en Buenos Aires de un instante ISO; null si no es una fecha. */
export function diaBuenosAires(iso: string): string | null {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(t);
}

/**
 * ¿El instante cae dentro de starts_on..ends_on (inclusive, días de Buenos
 * Aires)? Con un solo extremo cargado, el otro queda abierto; sin ninguno no
 * hay ventana y no se puede afirmar nada.
 */
export function dentroDeVentana(iso: string | null | undefined, v: VentanaLanzamiento): boolean {
  if (!iso) return false;
  if (!v.starts_on && !v.ends_on) return false;
  const dia = diaBuenosAires(iso);
  if (!dia) return false;
  if (v.starts_on && dia < v.starts_on) return false;
  if (v.ends_on && dia > v.ends_on) return false;
  return true;
}

/** Contactos de prueba del propio equipo: no son ventas. */
export function esContactoDePrueba(c: Pick<ContactoGhl, "email">): boolean {
  const email = (c.email ?? "").toLowerCase();
  return email.includes("laureanosierra") || email.includes("prueba") || email.includes("test@");
}

export const normalizarTag = (t: string) => t.trim().toLowerCase();

export function tieneTag(c: Pick<ContactoGhl, "tags">, tag: string): boolean {
  const buscada = normalizarTag(tag);
  return (c.tags ?? []).some((t) => normalizarTag(String(t)) === buscada);
}

/**
 * Contacto + mapeo -> fila a importar. La fecha solo se guarda si es confiable:
 * el contacto entró por un link de pago Y su alta cae dentro del lanzamiento;
 * si no, null (cuenta en los totales pero no en el gráfico por día).
 */
export function contactoAFila(
  c: ContactoGhl,
  m: MapeoVenta,
  clientId: string,
  ventana: VentanaLanzamiento,
): FilaVenta {
  const fechaConfiable =
    c.source === "payment_link" && dentroDeVentana(c.dateAdded, ventana) && c.dateAdded
      ? new Date(c.dateAdded).toISOString()
      : null;
  return {
    page_id: m.page_id,
    client_id: clientId,
    external_id: `ghl:${c.id}`,
    occurred_at: fechaConfiable,
    amount: m.amount,
    currency: m.currency,
    list_price: true,
    source: "ghl",
  };
}
