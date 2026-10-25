/** Mail de invitación a synx control (el portal de clientes). Lo firma el equipo. */
import { enlaceAlternativo, escaparHtml, boton, parrafo, plantilla, puntos, PIE_TEXTO, type Remitente } from "@/lib/email/marca";

export { escaparHtml };

const PUNTOS = [
  { titulo: "Tiempo real", detalle: "Visitas, registros y ventas de cada landing a medida que pasan." },
  { titulo: "Origen", detalle: "De qué campaña, anuncio o red llega cada persona." },
  { titulo: "Cierre", detalle: "El reporte final de cada lanzamiento, con el análisis del equipo." },
];

export function invitacionPortalEmail(cliente: string, url: string) {
  const nombre = cliente.replace(/[\r\n]+/g, " ").trim();
  const subject = `${nombre}: tu acceso a synx control ya está listo`;
  const intro = `Preparamos el espacio de ${nombre} en synx control. Desde ahí sigues cada lanzamiento con datos reales, sin esperar a que te pasemos un reporte.`;
  const nota = "Este enlace es personal: no lo compartas.";
  const pie = "Si no esperabas este mail, puedes ignorarlo.";

  const html = plantilla({
    titulo: subject,
    preheader: "Tus lanzamientos, en tiempo real y en un solo lugar.",
    etiqueta: "synx control",
    encabezado: "Tu acceso ya está listo",
    cuerpo: [parrafo(intro), puntos(PUNTOS), boton("Activar mi acceso →", url), enlaceAlternativo(url, nota)].join("\n"),
    pie,
  });

  const text = [
    "synx control",
    "",
    "Tu acceso ya está listo",
    "",
    intro,
    "",
    ...PUNTOS.map((p, i) => `${String(i + 1).padStart(2, "0")} ${p.titulo}: ${p.detalle}`),
    "",
    "Activar mi acceso:",
    url,
    "",
    nota,
    pie,
    "",
    PIE_TEXTO,
  ].join("\n");

  const remitente: Remitente = "equipo";
  return { subject, html, text, remitente };
}
