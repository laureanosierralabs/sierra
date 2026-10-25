/**
 * Mail de resumen de un lanzamiento para el cliente: el diario (ayer contra lo
 * acumulado) y el final (todo el lanzamiento). Lógica pura: recibe los datos
 * ya leídos y devuelve asunto, HTML apto para clientes de correo y texto.
 */
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import { cruzarRegistrados } from "@/lib/lanzamientos/despues";
import { rankingUtm, resumirOrigenes } from "@/lib/lanzamientos/origen";
import { conversion, resumirVisitas, type TipoLanding } from "@/lib/lanzamientos/tipos";
import { filtrarPorPeriodo } from "@/lib/lanzamientos/vista";
import { escaparHtml } from "@/lib/email/invitacion-portal";

export type TipoReporte = "diario" | "final";

export type DatosReporte = Pick<DetalleLanzamiento, "paginas" | "registros" | "visitas" | "referrers" | "compras" | "despues">;

export interface EntradaReporte {
  tipo: TipoReporte;
  /** Nombre del lanzamiento. */
  nombre: string;
  detalle: DatosReporte;
  /** Hoy en AAAA-MM-DD (hora de Buenos Aires). El diario resume el día anterior. */
  hoy: string;
  /** Botón "Ver el panel completo" (diario). Null si el cliente no tiene portal. */
  urlPanel: string | null;
  /** Botón al reporte de cierre (final). Null si el cliente no tiene portal. */
  urlReporte: string | null;
  /** Análisis redactado y aprobado por el owner (solo el final). Texto plano con párrafos. */
  analisis?: string | null;
}

/** Dirección pública de la app, sin barra final. Vacío si no hay con qué armarla. */
export function urlBaseApp(env: { APP_URL?: string; VERCEL_PROJECT_PRODUCTION_URL?: string }): string {
  const propia = env.APP_URL?.trim();
  if (propia) return propia.replace(/\/+$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return vercel ? `https://${vercel}` : "";
}

/* ───────────── Destinatarios ───────────── */

export const MAX_DESTINATARIOS = 10;

/**
 * Emails separados por coma, punto y coma, espacio o salto de línea: en
 * minúscula, sin repetir y con un tope. Un email mal escrito invalida todo
 * (mejor avisar que mandar el reporte a medias).
 */
export function leerDestinatarios(texto: string): { emails: string[] } | { error: string } {
  const emails: string[] = [];
  for (const crudo of texto.split(/[\s,;]+/)) {
    const email = crudo.trim().toLowerCase();
    if (!email) continue;
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: `"${crudo.slice(0, 60)}" no es un email válido` };
    }
    if (!emails.includes(email)) emails.push(email);
  }
  if (emails.length > MAX_DESTINATARIOS) return { error: `Máximo ${MAX_DESTINATARIOS} destinatarios` };
  return { emails };
}

/* ───────────── Cálculo ───────────── */

const restarDia = (dia: string) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** AAAA-MM-DD → DD/MM/AAAA. */
const fechaLegible = (dia: string) => dia.split("-").reverse().join("/");

export interface Totales {
  visitantes: number;
  registros: number;
  /** Registros sobre visitantes de las landings de registro con visitas medidas. */
  conversion: number | null;
  ventas: number;
  ingresos: { moneda: string; total: number }[];
  precioLista: boolean;
}

export function totales(d: DatosReporte): Totales {
  const trafico = resumirVisitas(d.visitas);
  const porPagina = new Map<string, number>();
  for (const r of d.registros) if (r.page_id) porPagina.set(r.page_id, (porPagina.get(r.page_id) ?? 0) + 1);

  // Igual que el reporte de cierre: solo cuentan las landings que midieron visitas.
  const tasa = (tipo: TipoLanding) => {
    const medidas = d.paginas.filter((p) => p.kind === tipo && (trafico.porPagina[p.id] ?? 0) > 0);
    return conversion(
      medidas.reduce((t, p) => t + (porPagina.get(p.id) ?? 0), 0),
      medidas.reduce((t, p) => t + (trafico.porPagina[p.id] ?? 0), 0),
    );
  };

  const ingresos = new Map<string, number>();
  for (const c of d.compras) {
    if (c.amount === null) continue;
    const moneda = c.currency ?? "—";
    ingresos.set(moneda, (ingresos.get(moneda) ?? 0) + c.amount);
  }

  return {
    visitantes: trafico.total,
    registros: d.registros.length,
    conversion: tasa("registro"),
    ventas: d.compras.length,
    ingresos: [...ingresos.entries()].map(([moneda, total]) => ({ moneda, total })),
    precioLista: d.compras.some((c) => c.list_price),
  };
}

export function dinero(i: { moneda: string; total: number }): string {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: i.moneda, maximumFractionDigits: 0 }).format(
      i.total,
    );
  } catch {
    return `${Math.round(i.total).toLocaleString("es-AR")} ${i.moneda}`;
  }
}

const entero = (n: number) => n.toLocaleString("es-AR");
const porcentaje = (n: number | null) => (n === null ? "—" : `${String(n).replace(".", ",")} %`);

interface Ranking {
  titulo: string;
  filas: { etiqueta: string; detalle: string }[];
}

function rankings(d: DatosReporte): Ranking[] {
  const salida: Ranking[] = [];

  const fuentes = resumirVisitas(d.visitas)
    .porFuente.filter((f) => f.fuente !== "" && f.visitantes > 0)
    .slice(0, 3);
  if (fuentes.length > 0) {
    salida.push({
      titulo: "Fuentes de tráfico",
      filas: fuentes.map((f) => ({ etiqueta: f.fuente, detalle: `${entero(f.visitantes)} visitantes` })),
    });
  }

  for (const [campo, titulo] of [
    ["utm_campaign", "Campañas"],
    ["utm_content", "Anuncios"],
  ] as const) {
    const filas = rankingUtm(d.registros, campo, 20)
      .filas.filter((f) => f.valor !== null)
      .slice(0, 3);
    if (filas.length > 0) {
      salida.push({
        titulo: `${titulo} (por registros)`,
        filas: filas.map((f) => ({ etiqueta: f.valor as string, detalle: `${entero(f.registros)} registros` })),
      });
    }
  }

  const origenes = resumirOrigenes(d.referrers).slice(0, 3);
  if (origenes.length > 0) {
    salida.push({
      titulo: "Tráfico sin UTM, por origen",
      filas: origenes.map((o) => ({ etiqueta: o.origen, detalle: `${entero(o.visitantes)} visitantes` })),
    });
  }
  return salida;
}

interface Paso {
  etiqueta: string;
  valor: string;
}

/** Quiénes de los registrados dieron cada paso posterior (cruce por email). */
function pasos(d: DatosReporte): Paso[] {
  if (!d.despues) return [];
  const salida: Paso[] = [];
  const whatsapp = d.despues.eventos.filter((e) => e.kind === "whatsapp_click");
  if (whatsapp.length > 0) {
    const c = cruzarRegistrados(
      d.registros,
      whatsapp.map((e) => e.email),
    );
    if (c.total > 0) salida.push({ etiqueta: "Entraron al grupo de WhatsApp", valor: `${c.cruzan} de ${c.total}` });
  }
  if (d.despues.webinar.length > 0) {
    const c = cruzarRegistrados(
      d.registros,
      d.despues.webinar.map((e) => e.email),
    );
    if (c.total > 0) salida.push({ etiqueta: "Se conectaron al webinar", valor: `${c.cruzan} de ${c.total}` });
  }
  return salida;
}

/* ───────────── HTML ───────────── */

const FUENTE = "font-family:Arial,Helvetica,sans-serif;";

function fila(c1: string, c2: string, c3?: string): string {
  const celda = (t: string, extra: string) =>
    `<td style="padding:8px 0;border-bottom:1px solid #262626;${FUENTE}font-size:14px;line-height:20px;${extra}">${t}</td>`;
  return `<tr>${celda(c1, "color:#a3a3a3;")}${celda(c2, "color:#ffffff;font-weight:700;text-align:right;")}${
    c3 === undefined ? "" : celda(c3, "color:#ffffff;font-weight:700;text-align:right;")
  }</tr>`;
}

function seccion(titulo: string, cuerpo: string): string {
  return `<tr><td style="padding:24px 32px 0;">
<div style="${FUENTE}font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#a3a3a3;padding-bottom:4px;">${escaparHtml(titulo)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cuerpo}</table>
</td></tr>`;
}

/** Títulos de las secciones del análisis: se resaltan si van solos en su línea. */
const TITULOS_ANALISIS = /^(qué funcionó|qué no funcionó|qué mejorar para el próximo lanzamiento)\s*:?$/i;

/** Texto plano del análisis → bloques de párrafos (separados por línea en blanco), todo escapado. */
export function analisisHtml(texto: string): string {
  return texto
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((bloque) => bloque.trim())
    .filter(Boolean)
    .map((bloque) =>
      bloque
        .split("\n")
        .map((linea) => {
          const l = escaparHtml(linea.trim());
          return TITULOS_ANALISIS.test(linea.trim()) ? `<strong style="color:#ffffff;">${l}</strong>` : l;
        })
        .join("<br>"),
    )
    .map((b) => `<p style="margin:0 0 12px;${FUENTE}font-size:14px;line-height:22px;color:#d4d4d4;">${b}</p>`)
    .join("");
}

export function reporteLanzamientoEmail(e: EntradaReporte): { subject: string; html: string; text: string } {
  const nombre = e.nombre.replace(/[\r\n]+/g, " ").trim() || "Tu lanzamiento";
  const final = e.tipo === "final";
  const ayer = restarDia(e.hoy);
  const diaResumen = fechaLegible(ayer);

  const subject = final ? `${nombre} · resumen final` : `${nombre} · resumen del ${diaResumen}`;

  const acumulado = totales(e.detalle);
  const delDia = final
    ? null
    : totales(filtrarPorPeriodo(e.detalle, { desde: ayer, hasta: ayer, dias: 1 }));

  const etiquetaCol1 = final ? "Todo el lanzamiento" : `Ayer (${diaResumen})`;
  const etiquetaCol2 = "Acumulado";

  /* Métricas: [etiqueta, columna del día, acumulado]. En el final es una sola columna. */
  const metricas: { etiqueta: string; dia: string; total: string }[] = [
    {
      etiqueta: "Visitantes",
      dia: delDia ? entero(delDia.visitantes) : "",
      total: entero(acumulado.visitantes),
    },
    {
      etiqueta: "Registros",
      dia: delDia ? entero(delDia.registros) : "",
      total: entero(acumulado.registros),
    },
    {
      etiqueta: "Conversión",
      dia: delDia ? porcentaje(delDia.conversion) : "",
      total: porcentaje(acumulado.conversion),
    },
  ];
  if (acumulado.ventas > 0) {
    metricas.push({ etiqueta: "Ventas", dia: delDia ? entero(delDia.ventas) : "", total: entero(acumulado.ventas) });
    if (acumulado.ingresos.length > 0) {
      metricas.push({
        etiqueta: acumulado.precioLista ? "Ingresos (precio de lista)" : "Ingresos",
        dia: delDia ? (delDia.ingresos.map(dinero).join(" + ") || "—") : "",
        total: acumulado.ingresos.map(dinero).join(" + "),
      });
    }
  }

  const tablaMetricas = final
    ? seccion(
        etiquetaCol1,
        metricas.map((m) => fila(escaparHtml(m.etiqueta), escaparHtml(m.total))).join(""),
      )
    : seccion(
        `${etiquetaCol1} y ${etiquetaCol2.toLowerCase()}`,
        `<tr><td></td><td style="${FUENTE}font-size:12px;color:#a3a3a3;text-align:right;padding:4px 0;">${escaparHtml(etiquetaCol1)}</td><td style="${FUENTE}font-size:12px;color:#a3a3a3;text-align:right;padding:4px 0 4px 12px;">${escaparHtml(etiquetaCol2)}</td></tr>` +
          metricas.map((m) => fila(escaparHtml(m.etiqueta), escaparHtml(m.dia), escaparHtml(m.total))).join(""),
      );

  const listas = rankings(e.detalle);
  const pasosPosteriores = pasos(e.detalle);

  const bloques = [
    tablaMetricas,
    ...listas.map((r) =>
      seccion(
        r.titulo,
        r.filas.map((f) => fila(escaparHtml(f.etiqueta), escaparHtml(f.detalle))).join(""),
      ),
    ),
    ...(pasosPosteriores.length > 0
      ? [
          seccion(
            "Después del registro",
            pasosPosteriores.map((p) => fila(escaparHtml(p.etiqueta), escaparHtml(p.valor))).join(""),
          ),
        ]
      : []),
  ].join("\n");

  const analisis = final ? e.analisis?.trim() || null : null;
  const bloqueAnalisis = analisis
    ? `<tr><td style="padding:24px 32px 0;">
<div style="${FUENTE}font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#a3a3a3;padding-bottom:8px;">Análisis del lanzamiento</div>
${analisisHtml(analisis)}
</td></tr>`
    : "";

  const url = final ? e.urlReporte : e.urlPanel;
  const textoBoton = final ? "Ver el reporte de cierre" : "Ver el panel completo";
  const u = url ? escaparHtml(url) : "";
  const boton = url
    ? `<tr><td style="padding:28px 32px 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#0000ff;border-radius:999px;"><a href="${u}" style="display:inline-block;padding:14px 28px;${FUENTE}font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${textoBoton}</a></td></tr></table>
</td></tr>`
    : "";

  const titulo = final ? "Resumen final de tu lanzamiento" : `Resumen del ${diaResumen}`;
  const intro = final
    ? "Tu lanzamiento terminó. Estos son los números de todo el período."
    : "Así le fue ayer a tu lanzamiento y cómo viene en total.";

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#171717;border-radius:16px;border:1px solid #262626;">
<tr><td style="padding:32px 32px 8px;${FUENTE}font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#a3a3a3;">synx build &middot; ${escaparHtml(nombre)}</td></tr>
<tr><td style="padding:8px 32px 0;${FUENTE}font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">${escaparHtml(titulo)}</td></tr>
<tr><td style="padding:12px 32px 0;${FUENTE}font-size:15px;line-height:24px;color:#d4d4d4;">${escaparHtml(intro)}</td></tr>
${bloques}
${bloqueAnalisis}
${boton}
<tr><td style="padding:28px 32px 32px;${FUENTE}font-size:12px;line-height:18px;color:#737373;">Los visitantes son únicos por día: quien vuelve otro día cuenta de nuevo.${acumulado.precioLista ? " Los ingresos se calculan con el precio de lista, sin cupones ni reembolsos." : ""}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const lineas: string[] = [`synx build · ${nombre}`, "", titulo, intro, ""];
  if (final) {
    lineas.push(etiquetaCol1.toUpperCase());
    for (const m of metricas) lineas.push(`${m.etiqueta}: ${m.total}`);
  } else {
    lineas.push(`${etiquetaCol1.toUpperCase()} / ${etiquetaCol2.toUpperCase()}`);
    for (const m of metricas) lineas.push(`${m.etiqueta}: ${m.dia} / ${m.total}`);
  }
  for (const r of listas) {
    lineas.push("", r.titulo.toUpperCase());
    for (const f of r.filas) lineas.push(`- ${f.etiqueta}: ${f.detalle}`);
  }
  if (pasosPosteriores.length > 0) {
    lineas.push("", "DESPUÉS DEL REGISTRO");
    for (const p of pasosPosteriores) lineas.push(`- ${p.etiqueta}: ${p.valor}`);
  }
  if (analisis) lineas.push("", "ANÁLISIS DEL LANZAMIENTO", analisis);
  if (url) lineas.push("", `${textoBoton}:`, url);
  const text = lineas.join("\n");

  return { subject, html, text };
}
