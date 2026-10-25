/**
 * Diseño común de los mails de synx build: fondo negro, logo blanco, Geist
 * (con Arial de respaldo: Gmail no carga fuentes web) y el azul de la marca.
 * Lógica pura: arma HTML apto para clientes de correo, todo escapado.
 */

/** Quién firma el mail: el equipo (team@) o Laureano (laureano@, los reportes). */
export type Remitente = "equipo" | "personal";

export function escaparHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const FUENTE = "font-family:Geist,'Helvetica Neue',Arial,Helvetica,sans-serif;";
export const AZUL = "#0000ff";
/** El azul claro de la paleta (400): el #0000ff no se lee como texto sobre negro. */
const AZUL_TEXTO = "#5073ff";
export const EMAIL_EQUIPO = "team@synxbuild.com";

const LOGO = "https://app.synxbuild.com/synxbuild/synxbuild-white.png";
const SITIO = "https://laureanosierra.com";

/** Fila de texto: un párrafo escapado. */
export function parrafo(texto: string): string {
  return `<tr><td style="padding:14px 36px 0;${FUENTE}font-size:15px;line-height:24px;color:#d4d4d4;">${escaparHtml(texto)}</td></tr>`;
}

/** Fila con el botón azul de la marca. */
export function boton(texto: string, url: string): string {
  return `<tr><td style="padding:30px 36px 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${AZUL};border-radius:999px;"><a href="${escaparHtml(url)}" style="display:inline-block;padding:14px 30px;${FUENTE}font-size:15px;font-weight:600;letter-spacing:-0.2px;color:#ffffff;text-decoration:none;">${escaparHtml(texto)}</a></td></tr></table>
</td></tr>`;
}

/** El link escrito, por si el botón no abre. `nota` va antes (ej.: "Este enlace es personal."). */
export function enlaceAlternativo(url: string, nota?: string): string {
  const u = escaparHtml(url);
  return `<tr><td style="padding:22px 36px 0;${FUENTE}font-size:13px;line-height:20px;color:#8a8a8a;">${nota ? `${escaparHtml(nota)} ` : ""}Si el bot&oacute;n no funciona, copia y pega este enlace en tu navegador:<br><a href="${u}" style="color:#a3a3a3;word-break:break-all;">${u}</a></td></tr>`;
}

/** Un extracto citado, con la barra azul a la izquierda. */
export function cita(rotulo: string, texto: string): string {
  return `<tr><td style="padding:18px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-left:2px solid ${AZUL};padding:4px 0 4px 16px;${FUENTE}font-size:14px;line-height:22px;color:#d4d4d4;"><span style="font-size:12px;color:#8a8a8a;">${escaparHtml(rotulo)}</span><br>${escaparHtml(texto)}</td></tr></table></td></tr>`;
}

/** Puntos numerados (01, 02…): título en blanco y una línea de detalle. */
export function puntos(lista: { titulo: string; detalle: string }[]): string {
  const filas = lista
    .map(
      (p, i) => `<tr>
<td valign="top" style="width:36px;padding:14px 0;border-top:1px solid #1f1f1f;${FUENTE}font-size:12px;line-height:22px;font-weight:600;color:${AZUL_TEXTO};">${String(i + 1).padStart(2, "0")}</td>
<td valign="top" style="padding:14px 0;border-top:1px solid #1f1f1f;${FUENTE}font-size:14px;line-height:22px;color:#a3a3a3;"><span style="color:#ffffff;font-weight:600;">${escaparHtml(p.titulo)}</span><br>${escaparHtml(p.detalle)}</td>
</tr>`,
    )
    .join("");
  return `<tr><td style="padding:24px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas}</table></td></tr>`;
}

interface Plantilla {
  /** Va en <title> y como respaldo del texto de vista previa. */
  titulo: string;
  /** Texto de vista previa en la bandeja (oculto en el cuerpo). */
  preheader?: string;
  /** Rótulo chico sobre el título (ej.: "synx control"). */
  etiqueta: string;
  /** Título grande del mail. */
  encabezado: string;
  /** Filas <tr> ya armadas (parrafo, boton, cita…). */
  cuerpo: string;
  /** Por qué le llega este mail. */
  pie?: string;
}

/** El mail entero: logo arriba, tarjeta negra con el contenido y el pie de la marca. */
export function plantilla(p: Plantilla): string {
  const pre = escaparHtml(p.preheader ?? p.titulo);
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&display=swap" rel="stylesheet">
<title>${escaparHtml(p.titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#000000;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#000000;">${pre}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 24px;"><img src="${LOGO}" width="118" height="24" alt="synx build" style="display:block;border:0;outline:none;height:auto;width:118px;"></td></tr>
<tr><td style="background:#0a0a0a;border:1px solid #1f1f1f;border-radius:20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:36px 36px 0;${FUENTE}font-size:12px;line-height:16px;letter-spacing:0.4px;color:#8a8a8a;"><span style="color:${AZUL_TEXTO};">&#9679;</span>&nbsp; ${escaparHtml(p.etiqueta)}</td></tr>
<tr><td style="padding:14px 36px 0;${FUENTE}font-size:26px;line-height:32px;font-weight:600;letter-spacing:-0.9px;color:#ffffff;">${escaparHtml(p.encabezado)}</td></tr>
${p.cuerpo}
<tr><td style="padding:36px 36px 0;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</td></tr>
${p.pie ? `<tr><td style="padding:24px 8px 0;${FUENTE}font-size:12px;line-height:18px;color:#6b6b6b;">${escaparHtml(p.pie)}</td></tr>` : ""}
<tr><td style="padding:16px 8px 0;${FUENTE}font-size:12px;line-height:18px;color:#6b6b6b;">synx build &middot; <a href="mailto:${EMAIL_EQUIPO}" style="color:#8a8a8a;text-decoration:none;">${EMAIL_EQUIPO}</a> &middot; <a href="${SITIO}" style="color:#8a8a8a;text-decoration:none;">laureanosierra.com</a></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Pie del texto plano, igual en todos los mails. */
export const PIE_TEXTO = `synx build · ${EMAIL_EQUIPO} · laureanosierra.com`;
