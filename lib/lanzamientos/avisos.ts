/**
 * Mails de aviso del cron de reportes: borrador del reporte final listo para
 * el owner y meta de registros alcanzada. Lógica pura: devuelve asunto, HTML
 * apto para clientes de correo y texto.
 */
import { boton, parrafo, PIE_TEXTO, plantilla, type Remitente } from "@/lib/email/marca";

export interface CorreoAviso {
  subject: string;
  html: string;
  text: string;
  remitente: Remitente;
}

const limpiar = (t: string) => t.replace(/[\r\n]+/g, " ").trim();
const entero = (n: number) => n.toLocaleString("es-AR");

function marco(
  etiqueta: string,
  titulo: string,
  parrafos: string[],
  accion: { texto: string; url: string } | null,
  pie?: string,
): string {
  return plantilla({
    titulo,
    preheader: parrafos[0],
    etiqueta,
    encabezado: titulo,
    cuerpo: [...parrafos.map(parrafo), accion ? boton(accion.texto, accion.url) : ""].join("\n"),
    pie,
  });
}

/** Texto plano del aviso: asunto, párrafos, link y el pie de la marca. */
function textoAviso(subject: string, parrafos: string[], accion: { texto: string; url: string | null }): string {
  return [subject, "", ...parrafos, ...(accion.url ? ["", `${accion.texto}:`, accion.url] : []), "", PIE_TEXTO].join("\n");
}

/** Al owner: el borrador del reporte final ya está para revisar. */
export function avisoBorradorEmail(e: { nombre: string; url: string | null }): CorreoAviso {
  const nombre = limpiar(e.nombre) || "El lanzamiento";
  const subject = `El reporte final de ${nombre} está listo para revisar`;
  const parrafos = [
    "El lanzamiento terminó y la IA preparó un borrador del análisis final.",
    "Revisalo, editalo si hace falta y aprobalo: recién entonces se le manda al cliente.",
  ];
  return {
    subject,
    html: marco(`synx studio · ${nombre}`, "Reporte final para revisar", parrafos, e.url ? { texto: "Revisar el borrador", url: e.url } : null),
    text: textoAviso(subject, parrafos, { texto: "Abrir el lanzamiento", url: e.url }),
    remitente: "equipo",
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
  return {
    subject,
    html: marco(`synx control · ${nombre}`, "Llegaron a la meta", parrafos, e.urlPortal ? { texto: "Ver el panel", url: e.urlPortal } : null),
    text: textoAviso(subject, parrafos, { texto: "Ver el panel", url: e.urlPortal }),
    remitente: "personal",
  };
}

/** Al cliente y al owner: se llenó un grupo de WhatsApp y quedan pocos libres. */
export function avisoPocosGruposEmail(e: { nombre: string; libres: number; url: string | null }): CorreoAviso {
  const nombre = limpiar(e.nombre) || "Tu lanzamiento";
  const subject =
    e.libres === 0
      ? `⚠️ ${nombre}: no quedan grupos de WhatsApp libres`
      : `${nombre}: queda ${e.libres === 1 ? "1 grupo" : `${e.libres} grupos`} de WhatsApp libre${e.libres === 1 ? "" : "s"}`;
  const parrafos = [
    e.libres === 0
      ? "Se llenó el último grupo de WhatsApp cargado. Hasta que cargues uno nuevo, la gente que se registra va a ese último grupo."
      : "Se llenó un grupo de WhatsApp y el link ya manda al siguiente.",
    "Crea los grupos nuevos y pega sus links en el lanzamiento: el link de la landing y de los mails no cambia, empieza a mandar a los nuevos solo.",
  ];
  return {
    subject,
    html: marco(
      `synx control · ${nombre}`,
      e.libres === 0 ? "No quedan grupos libres" : "Quedan pocos grupos libres",
      parrafos,
      e.url ? { texto: "Cargar grupos", url: e.url } : null,
    ),
    text: textoAviso(subject, parrafos, { texto: "Cargar grupos", url: e.url }),
    remitente: "equipo",
  };
}
