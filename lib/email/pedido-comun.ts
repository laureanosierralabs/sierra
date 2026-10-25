import { boton, cita, enlaceAlternativo, parrafo, PIE_TEXTO, plantilla } from "@/lib/email/marca";

/** Piezas compartidas por los mails de pedidos. Lógica pura: sin Supabase ni Clerk. */

/** Dirección pública de la app, sin barra final. Vacío si no hay con qué armarla. */
export function urlBaseApp(env: { APP_URL?: string; VERCEL_PROJECT_PRODUCTION_URL?: string }): string {
  const propia = env.APP_URL?.trim();
  if (propia) return propia.replace(/\/+$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return vercel ? `https://${vercel}` : "";
}

/** Texto en una sola línea, recortado a `max` caracteres (con «…» si se cortó). */
export function extracto(texto: string | null | undefined, max = 240): string {
  const limpio = (texto ?? "").replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max - 1).trimEnd()}…`;
}

/** Asunto sin saltos de línea (evita inyección de cabeceras). */
export const lineaUnica = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

interface Bloque {
  /** Etiqueta pequeña sobre el título. */
  etiqueta: string;
  titulo: string;
  /** Párrafos de texto plano (se escapan). */
  parrafos: string[];
  /** Cita opcional (un extracto): se muestra con barra lateral. */
  cita?: { rotulo: string; texto: string } | null;
  boton: { texto: string; url: string };
  pie: string;
}

/** HTML apto para clientes de correo, con el diseño común de la marca. */
export function armarEmail(b: Bloque): { html: string; text: string } {
  const html = plantilla({
    titulo: b.titulo,
    etiqueta: b.etiqueta,
    encabezado: b.titulo,
    cuerpo: [
      ...b.parrafos.map(parrafo),
      b.cita?.texto ? cita(b.cita.rotulo, b.cita.texto) : "",
      boton(b.boton.texto, b.boton.url),
      enlaceAlternativo(b.boton.url),
    ].join("\n"),
    pie: b.pie,
  });

  const text = [
    b.etiqueta,
    "",
    b.titulo,
    "",
    ...b.parrafos.flatMap((p) => [p, ""]),
    ...(b.cita?.texto ? [`${b.cita.rotulo}: ${b.cita.texto}`, ""] : []),
    `${b.boton.texto}:`,
    b.boton.url,
    "",
    b.pie,
    "",
    PIE_TEXTO,
  ].join("\n");

  return { html, text };
}

/** Emails válidos, en minúscula y sin repetir. Descarta vacíos y null. */
export function emailsUnicos(lista: (string | null | undefined)[]): string[] {
  const vistos = new Set<string>();
  for (const crudo of lista) {
    const email = (crudo ?? "").trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) vistos.add(email);
  }
  return [...vistos];
}
