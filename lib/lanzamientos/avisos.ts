/**
 * Mails de aviso del cron de reportes: borrador del reporte final listo para
 * el owner y meta de registros alcanzada. Lógica pura: devuelve asunto, HTML
 * apto para clientes de correo y texto.
 */
import { escaparHtml } from "@/lib/email/invitacion-portal";

export interface CorreoAviso {
  subject: string;
  html: string;
  text: string;
}

const FUENTE = "font-family:Arial,Helvetica,sans-serif;";
const limpiar = (t: string) => t.replace(/[\r\n]+/g, " ").trim();
const entero = (n: number) => n.toLocaleString("es-AR");

function marco(nombre: string, titulo: string, parrafos: string[], boton: { texto: string; url: string } | null): string {
  const cuerpo = parrafos
    .map(
      (p) =>
        `<tr><td style="padding:12px 32px 0;${FUENTE}font-size:15px;line-height:24px;color:#d4d4d4;">${escaparHtml(p)}</td></tr>`,
    )
    .join("\n");
  const accion = boton
    ? `<tr><td style="padding:28px 32px 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#3758f9;border-radius:999px;"><a href="${escaparHtml(boton.url)}" style="display:inline-block;padding:14px 28px;${FUENTE}font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escaparHtml(boton.texto)}</a></td></tr></table>
</td></tr>`
    : "";
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#171717;border-radius:16px;border:1px solid #262626;">
<tr><td style="padding:32px 32px 8px;${FUENTE}font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#a3a3a3;">Sierra Labs &middot; ${escaparHtml(nombre)}</td></tr>
<tr><td style="padding:8px 32px 0;${FUENTE}font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">${escaparHtml(titulo)}</td></tr>
${cuerpo}
${accion}
<tr><td style="padding:28px 32px 32px;">&nbsp;</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Al owner: el borrador del reporte final ya está para revisar. */
export function avisoBorradorEmail(e: { nombre: string; url: string | null }): CorreoAviso {
  const nombre = limpiar(e.nombre) || "El lanzamiento";
  const subject = `El reporte final de ${nombre} está listo para revisar`;
  const parrafos = [
    "El lanzamiento terminó y la IA preparó un borrador del análisis final.",
    "Revisalo, editalo si hace falta y aprobalo: recién entonces se le manda al cliente.",
  ];
  const text = [subject, "", ...parrafos, ...(e.url ? ["", "Abrir el lanzamiento:", e.url] : [])].join("\n");
  return {
    subject,
    html: marco(nombre, "Reporte final para revisar", parrafos, e.url ? { texto: "Revisar el borrador", url: e.url } : null),
    text,
  };
}

/** Si el lanzamiento llegó a la meta y todavía no se avisó. */
export function metaAlcanzada(l: {
  goal_registrations: number | null;
  status: string;
  goal_notified_at: string | null;
  registros: number;
}): boolean {
  return Boolean(
    l.goal_registrations && l.goal_registrations > 0 && l.status === "activo" && !l.goal_notified_at && l.registros >= l.goal_registrations,
  );
}

/** Al cliente y al owner: se llegó a la meta de registros. */
export function avisoMetaEmail(e: {
  nombre: string;
  meta: number;
  registros: number;
  visitantes: number | null;
  conversion: number | null;
  urlPortal: string | null;
}): CorreoAviso {
  const nombre = limpiar(e.nombre) || "Tu lanzamiento";
  const subject = `🎯 ${nombre} llegó a la meta de ${entero(e.meta)} registros`;
  const porcentaje = (n: number) => `${String(n).replace(".", ",")} %`;
  const parrafos = [
    `Ya hay ${entero(e.registros)} registros: la meta era de ${entero(e.meta)}.`,
    ...(e.visitantes && e.visitantes > 0
      ? [
          `Hasta ahora pasaron ${entero(e.visitantes)} visitantes${e.conversion !== null ? `, con una conversión de ${porcentaje(e.conversion)}` : ""}.`,
        ]
      : []),
    "El lanzamiento sigue abierto: los registros nuevos se siguen sumando.",
  ];
  const text = [subject, "", ...parrafos, ...(e.urlPortal ? ["", "Ver el panel:", e.urlPortal] : [])].join("\n");
  return {
    subject,
    html: marco(nombre, "Llegaron a la meta", parrafos, e.urlPortal ? { texto: "Ver el panel", url: e.urlPortal } : null),
    text,
  };
}
