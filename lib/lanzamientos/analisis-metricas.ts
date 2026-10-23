/**
 * Métricas de un lanzamiento listas para que la IA las analice. Lógica pura
 * (sin I/O): usa los mismos cálculos que el reporte por mail y el de cierre,
 * así el análisis nunca contradice los números que ve el cliente.
 */
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import { cruzarRegistrados, resumirCheckout } from "@/lib/lanzamientos/despues";
import { rankingUtm, resumirOrigenes } from "@/lib/lanzamientos/origen";
import { totales } from "@/lib/lanzamientos/reporte-diario";
import { conversion, resumirRegistros, resumirVisitas } from "@/lib/lanzamientos/tipos";

type Detalle = Pick<DetalleLanzamiento, "lanzamiento" | "paginas" | "registros" | "visitas" | "referrers" | "compras" | "despues">;

/** Cuántos elementos de cada ranking se le pasan al análisis. */
const TOPE = 5;

export interface MetricasAnalisis {
  lanzamiento: {
    nombre: string;
    estado: string;
    inicio: string | null;
    fin: string | null;
    /** Meta de registros; null = no se definió. */
    meta_registros: number | null;
  };
  totales: {
    visitantes: number;
    registros: number;
    /** Porcentaje con un decimal; null = no se pudo medir. */
    conversion_pct: number | null;
    ventas: number;
    ingresos: { moneda: string; total: number }[];
    /** Los ingresos son el precio de lista (ventas importadas), no lo realmente cobrado. */
    ingresos_son_precio_de_lista: boolean;
  };
  por_landing: {
    nombre: string;
    tipo: string;
    visitantes: number;
    registros: number;
    conversion_pct: number | null;
  }[];
  fuentes_de_trafico: { fuente: string; visitantes: number }[];
  campanas_por_registros: { campana: string; registros: number }[];
  anuncios_por_registros: { anuncio: string; registros: number }[];
  trafico_sin_utm_por_origen: { origen: string; visitantes: number }[];
  /** Día con más registros; null si no hubo. */
  pico_diario: { dia: string; registros: number } | null;
  despues_del_registro: {
    /** Registrados que hicieron clic para entrar al grupo de WhatsApp; null = no se mide. */
    whatsapp: { entraron: number; de: number } | null;
    /** Registrados que se conectaron al webinar; null = no se mide. */
    webinar: { entraron: number; de: number } | null;
    clics_al_checkout: number | null;
  };
  /** Cosas que NO se miden: la IA tiene que decirlo en vez de suponer. */
  datos_no_disponibles: string[];
}

export function metricasParaAnalisis(d: Detalle): MetricasAnalisis {
  const t = totales(d);
  const trafico = resumirVisitas(d.visitas);

  const registrosPorPagina = new Map<string, number>();
  for (const r of d.registros) if (r.page_id) registrosPorPagina.set(r.page_id, (registrosPorPagina.get(r.page_id) ?? 0) + 1);

  const porLanding = d.paginas.map((p) => {
    const visitantes = trafico.porPagina[p.id] ?? 0;
    const registros = registrosPorPagina.get(p.id) ?? 0;
    return {
      nombre: p.name,
      tipo: p.kind,
      visitantes,
      registros,
      conversion_pct: p.kind === "registro" && visitantes > 0 ? conversion(registros, visitantes) : null,
    };
  });

  const ranking = (campo: "utm_campaign" | "utm_content") =>
    rankingUtm(d.registros, campo, TOPE).filas.filter((f) => f.valor !== null) as { valor: string; registros: number }[];

  const picos = resumirRegistros(d.registros).porDia;
  const pico = picos.reduce<{ dia: string; registros: number } | null>(
    (mejor, p) => (!mejor || p.registros > mejor.registros ? p : mejor),
    null,
  );

  const cruce = (emails: (string | null)[]) => {
    const c = cruzarRegistrados(d.registros, emails);
    return c.total > 0 ? { entraron: c.cruzan, de: c.total } : null;
  };
  const whatsapp = d.despues?.eventos.filter((e) => e.kind === "whatsapp_click") ?? [];
  const webinar = d.despues?.webinar ?? [];
  const checkout = d.despues ? resumirCheckout(d.despues.eventos, d.paginas, null, t.ventas).total : null;

  const noDisponibles = ["gasto en publicidad (no se carga en el panel: no se puede calcular costo por registro ni retorno)"];
  if (t.visitantes === 0) noDisponibles.push("visitantes (no hay visitas medidas)");
  if (t.conversion === null) noDisponibles.push("conversión general (faltan visitas medidas o no son comparables)");
  if (!d.despues) noDisponibles.push("pasos posteriores al registro (WhatsApp, webinar, checkout)");

  return {
    lanzamiento: {
      nombre: d.lanzamiento.name,
      estado: d.lanzamiento.status,
      inicio: d.lanzamiento.starts_on,
      fin: d.lanzamiento.ends_on,
      meta_registros: d.lanzamiento.goal_registrations,
    },
    totales: {
      visitantes: t.visitantes,
      registros: t.registros,
      conversion_pct: t.conversion,
      ventas: t.ventas,
      ingresos: t.ingresos,
      ingresos_son_precio_de_lista: t.precioLista,
    },
    por_landing: porLanding,
    fuentes_de_trafico: trafico.porFuente
      .filter((f) => f.fuente !== "" && f.visitantes > 0)
      .slice(0, TOPE),
    campanas_por_registros: ranking("utm_campaign").map((f) => ({ campana: f.valor, registros: f.registros })),
    anuncios_por_registros: ranking("utm_content").map((f) => ({ anuncio: f.valor, registros: f.registros })),
    trafico_sin_utm_por_origen: resumirOrigenes(d.referrers).slice(0, TOPE),
    pico_diario: pico,
    despues_del_registro: {
      whatsapp: whatsapp.length > 0 ? cruce(whatsapp.map((e) => e.email)) : null,
      webinar: webinar.length > 0 ? cruce(webinar.map((e) => e.email)) : null,
      clics_al_checkout: checkout,
    },
    datos_no_disponibles: noDisponibles,
  };
}
