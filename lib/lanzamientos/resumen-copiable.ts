/**
 * Resumen en texto plano de un lanzamiento, para copiar y pegar (WhatsApp,
 * mail) cuando un operador pide los números. Lógica pura: usa los mismos
 * cálculos que el reporte por mail, así los números nunca se contradicen.
 * Solo afirma lo que sale de los datos: sin datos, la sección no aparece.
 */
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import { rankingUtm, resumirOrigenes } from "@/lib/lanzamientos/origen";
import { dinero, totales } from "@/lib/lanzamientos/reporte-diario";
import { conversion, diaDe } from "@/lib/lanzamientos/tipos";

type Detalle = Pick<DetalleLanzamiento, "lanzamiento" | "paginas" | "registros" | "visitas" | "referrers" | "compras" | "despues" | "truncado">;

const SIN_UTM = "Sin UTM (orgánico / directo)";
/** Fuentes que se listan; el resto se suma en "Otras fuentes". */
const TOPE_FUENTES = 8;
const TOPE_RANKING = 5;
const TOPE_ORIGENES = 3;
const DIAS_RECIENTES = 14;
/** Visitantes mínimos para que la conversión de una fuente cuente como "la mejor". */
const MIN_VISITANTES_COMPARABLES = 100;

const entero = (n: number) => n.toLocaleString("es-AR");
const cuenta = (n: number, uno: string, varios: string) => `${entero(n)} ${n === 1 ? uno : varios}`;
const leads = (n: number) => cuenta(n, "lead", "leads");
const pct = (n: number) => `${String(n).replace(".", ",")} %`;
const diaMes = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

function encabezado(d: Detalle, hoy: string): string {
  const unica = d.paginas.length === 1 ? d.paginas[0] : null;
  const que = unica
    ? `de la landing ${unica.name}${unica.path ? ` (${unica.path})` : ""}`
    : `del lanzamiento ${d.lanzamiento.name}`;

  const dias = [...d.visitas.map((v) => v.day), ...d.registros.map((r) => diaDe(r.registered_at))].sort();
  if (dias.length === 0) return `Métricas ${que}: todavía sin datos.`;
  const desde = diaMes(dias[0]);
  const hasta = dias[dias.length - 1];
  return `Métricas ${que}, del ${desde} ${hasta >= hoy ? "a hoy" : `al ${diaMes(hasta)}`}:`;
}

interface Fuente {
  fuente: string;
  registros: number;
  visitantes: number;
}

/** Registros por utm_source, con los visitantes de las landings de registro de esa fuente. */
function fuentes(d: Detalle): Fuente[] {
  const deRegistro = new Set(d.paginas.filter((p) => p.kind === "registro").map((p) => p.id));
  const mapa = new Map<string, Fuente>();
  const de = (clave: string) => {
    let f = mapa.get(clave);
    if (!f) mapa.set(clave, (f = { fuente: clave, registros: 0, visitantes: 0 }));
    return f;
  };
  for (const r of d.registros) de(r.utm_source?.trim() || "").registros++;
  for (const v of d.visitas) {
    if (!deRegistro.has(v.page_id)) continue;
    const clave = v.utm_source?.trim() || "";
    // Solo las fuentes que trajeron registros: el resto no suma a "de dónde vienen los leads".
    if (mapa.has(clave)) de(clave).visitantes += Number(v.visitors);
  }
  return [...mapa.values()].sort((a, b) => b.registros - a.registros || a.fuente.localeCompare(b.fuente, "es"));
}

const etiqueta = (f: Fuente) => f.fuente || SIN_UTM;

export function resumenCopiable(d: Detalle, hoy: string): string {
  const bloques: string[] = [encabezado(d, hoy)];
  const t = totales(d);
  const hayRegistro = d.paginas.some((p) => p.kind === "registro");

  const lineasTotales = [`* ${entero(t.visitantes)} visitantes únicos`];
  if (hayRegistro || t.registros > 0) lineasTotales.push(`* ${cuenta(t.registros, "registro", "registros")}`);
  if (t.conversion !== null) lineasTotales.push(`* Conversión general: ${pct(t.conversion)}`);
  if (t.ventas > 0) lineasTotales.push(`* ${cuenta(t.ventas, "venta", "ventas")}`);
  if (t.ingresos.length > 0) {
    lineasTotales.push(`* Ingresos${t.precioLista ? " (precio de lista)" : ""}: ${t.ingresos.map(dinero).join(" + ")}`);
  }
  bloques.push(["Totales", ...lineasTotales].join("\n"));

  if (d.paginas.length > 1) {
    const visitasPorPagina = new Map<string, number>();
    for (const v of d.visitas) visitasPorPagina.set(v.page_id, (visitasPorPagina.get(v.page_id) ?? 0) + Number(v.visitors));
    const registrosPorPagina = new Map<string, number>();
    for (const r of d.registros) if (r.page_id) registrosPorPagina.set(r.page_id, (registrosPorPagina.get(r.page_id) ?? 0) + 1);
    const lineas = d.paginas.map((p) => {
      const vis = visitasPorPagina.get(p.id) ?? 0;
      const reg = registrosPorPagina.get(p.id) ?? 0;
      const conv = p.kind === "registro" ? conversion(reg, vis) : null;
      const partes = [cuenta(vis, "visitante", "visitantes")];
      if (p.kind === "registro") partes.push(cuenta(reg, "registro", "registros"));
      if (conv !== null) partes.push(pct(conv));
      return `* ${p.name}${p.path ? ` (${p.path})` : ""}: ${partes.join(" · ")}`;
    });
    bloques.push(["Por landing", ...lineas].join("\n"));
  }

  const lista = fuentes(d);
  if (t.registros > 0 && lista.length > 0) {
    const lineas: string[] = [];
    for (const f of lista.slice(0, TOPE_FUENTES)) {
      const conv = conversion(f.registros, f.visitantes);
      let linea = `${etiqueta(f)}: ${leads(f.registros)} (${pct(Math.round((f.registros / t.registros) * 1000) / 10)})`;
      if (conv !== null) linea += `, con ${pct(conv)} de conversión`;
      linea += ".";
      if (f.fuente === "") {
        const origenes = resumirOrigenes(d.referrers).slice(0, TOPE_ORIGENES);
        if (origenes.length > 0) {
          linea += ` Por origen: ${origenes.map((o) => `${o.origen} (${entero(o.visitantes)} visitantes)`).join(", ")}.`;
        }
      }
      lineas.push(linea);
    }
    const resto = lista.slice(TOPE_FUENTES).reduce((n, f) => n + f.registros, 0);
    if (resto > 0) lineas.push(`Otras fuentes: ${leads(resto)}.`);
    bloques.push(["De dónde vienen los leads", ...lineas].join("\n"));
  }

  const ranking = (campo: "utm_campaign" | "utm_content", titulo: string, prefijo: string) => {
    const filas = rankingUtm(d.registros, campo, TOPE_RANKING).filas.filter((f) => f.valor !== null);
    if (filas.length > 0) {
      bloques.push([titulo, ...filas.map((f) => `* ${prefijo}${f.valor}: ${leads(f.registros)}`)].join("\n"));
    }
  };
  ranking("utm_campaign", "Campañas que más traen", "Campaña ");
  ranking("utm_content", "Anuncios top", "");

  const porDia = new Map<string, number>();
  for (const r of d.registros) {
    const dia = diaDe(r.registered_at);
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  }
  if (porDia.size > 0) {
    const dias = [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-DIAS_RECIENTES);
    const mejor = Math.max(...dias.map(([, n]) => n));
    const texto = dias
      .map(([dia, n]) => `${diaMes(dia)}: ${entero(n)}${n === mejor && dias.length > 1 ? " (el mejor día)" : ""}`)
      .join(" · ");
    bloques.push([porDia.size > DIAS_RECIENTES ? `Por día (últimos ${DIAS_RECIENTES})` : "Por día", texto].join("\n"));
  }

  // Lectura rápida: solo comparaciones que salen directo de los números.
  if (lista.length > 1 && t.registros > 0) {
    const frases = [`La fuente que más leads trae es ${etiqueta(lista[0])}.`];
    const comparables = lista
      .map((f) => ({ f, conv: f.visitantes >= MIN_VISITANTES_COMPARABLES ? conversion(f.registros, f.visitantes) : null }))
      .filter((x): x is { f: Fuente; conv: number } => x.conv !== null)
      .sort((a, b) => b.conv - a.conv);
    if (comparables.length > 1) {
      const mejor = comparables[0];
      frases.push(
        mejor.f === lista[0]
          ? "También es la que mejor convierte."
          : `La que mejor convierte es ${etiqueta(mejor.f)} (${pct(mejor.conv)}).`,
      );
    }
    bloques.push(`Lectura rápida: ${frases.join(" ")}`);
  }

  if (d.truncado) bloques.push("Ojo: hay más registros de los que lee el panel; los totales son parciales.");
  return bloques.join("\n\n");
}
