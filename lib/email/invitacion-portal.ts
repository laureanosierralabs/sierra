/** Mail de invitación al portal de clientes (HTML apto para clientes de correo). */

export function escaparHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function invitacionPortalEmail(cliente: string, url: string) {
  const subject = `Tu portal de resultados de ${cliente.replace(/[\r\n]+/g, " ").trim()} ya está listo`;
  const c = escaparHtml(cliente);
  const u = escaparHtml(url);

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#171717;border-radius:16px;border:1px solid #262626;">
<tr><td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#a3a3a3;">synx build &middot; Portal de clientes</td></tr>
<tr><td style="padding:8px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">Tu portal de resultados de ${c} ya est&aacute; listo</td></tr>
<tr><td style="padding:16px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#d4d4d4;">Hola, te armamos tu portal. Ah&iacute; vas a ver tus lanzamientos con visitas, registros, ventas y de d&oacute;nde llega cada uno.</td></tr>
<tr><td style="padding:28px 32px 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#0000ff;border-radius:999px;"><a href="${u}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Activar mi portal</a></td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#a3a3a3;">Este enlace es personal: no lo compartas. Si el bot&oacute;n no funciona, copi&aacute; y peg&aacute; esta direcci&oacute;n en tu navegador:<br><a href="${u}" style="color:#7b94ff;word-break:break-all;">${u}</a></td></tr>
<tr><td style="padding:24px 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#737373;">Si no esperabas este mail, pod&eacute;s ignorarlo.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    "synx build · Portal de clientes",
    "",
    `Tu portal de resultados de ${cliente} ya está listo.`,
    "",
    "Hola, te armamos tu portal. Ahí vas a ver tus lanzamientos con visitas, registros, ventas y de dónde llega cada uno.",
    "",
    "Activar mi portal:",
    url,
    "",
    "Este enlace es personal: no lo compartas.",
    "Si no esperabas este mail, podés ignorarlo.",
  ].join("\n");

  return { subject, html, text };
}
