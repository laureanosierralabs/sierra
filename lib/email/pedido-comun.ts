import { escaparHtml } from "@/lib/email/invitacion-portal";

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

/** HTML apto para clientes de correo, con el mismo estilo que la invitación al portal. */
export function armarEmail(b: Bloque): { html: string; text: string } {
  const u = escaparHtml(b.boton.url);
  const parrafos = b.parrafos
    .map(
      (p) =>
        `<tr><td style="padding:12px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#d4d4d4;">${escaparHtml(p)}</td></tr>`,
    )
    .join("\n");
  const cita = b.cita?.texto
    ? `<tr><td style="padding:16px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-left:3px solid #0000ff;padding:4px 0 4px 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#d4d4d4;"><span style="font-size:12px;color:#a3a3a3;">${escaparHtml(b.cita.rotulo)}</span><br>${escaparHtml(b.cita.texto)}</td></tr></table></td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(b.titulo)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#171717;border-radius:16px;border:1px solid #262626;">
<tr><td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#a3a3a3;">${escaparHtml(b.etiqueta)}</td></tr>
<tr><td style="padding:8px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#ffffff;">${escaparHtml(b.titulo)}</td></tr>
${parrafos}
${cita}
<tr><td style="padding:28px 32px 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#0000ff;border-radius:999px;"><a href="${u}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escaparHtml(b.boton.texto)}</a></td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#a3a3a3;">Si el bot&oacute;n no funciona, copi&aacute; y peg&aacute; esta direcci&oacute;n en tu navegador:<br><a href="${u}" style="color:#7b94ff;word-break:break-all;">${u}</a></td></tr>
<tr><td style="padding:24px 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#737373;">${escaparHtml(b.pie)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

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
