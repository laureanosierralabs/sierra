import { today } from "@/lib/personal-finance";
import type { FiltroTipo, FinanceQuery, Segmento, Vista } from "./tipos";

const VISTAS_VALIDAS: Vista[] = ["resumen", "movimientos", "compromisos", "patrimonio"];
const SEGMENTOS_VALIDOS: Segmento[] = ["suscripciones", "programados", "deudas", "por-cobrar"];

/**
 * Pestañas de la pantalla anterior (`?tab=`) y su destino. Los links viejos y
 * los favoritos siguen funcionando.
 */
const TAB_LEGADO: Record<string, { vista: Vista; tipo?: FiltroTipo; seg?: Segmento }> = {
  summary: { vista: "resumen" },
  accounts: { vista: "patrimonio" },
  cuentas: { vista: "patrimonio" },
  goals: { vista: "patrimonio" },
  objetivos: { vista: "patrimonio" },
  income: { vista: "movimientos", tipo: "ingreso" },
  ingresos: { vista: "movimientos", tipo: "ingreso" },
  expenses: { vista: "movimientos", tipo: "egreso" },
  gastos: { vista: "movimientos", tipo: "egreso" },
  subscriptions: { vista: "compromisos", seg: "suscripciones" },
  suscripciones: { vista: "compromisos", seg: "suscripciones" },
  debts: { vista: "compromisos", seg: "deudas" },
  deudas: { vista: "compromisos", seg: "deudas" },
  receivables: { vista: "compromisos", seg: "por-cobrar" },
  "por-cobrar": { vista: "compromisos", seg: "por-cobrar" },
};

export interface ResolvedQuery {
  vista: Vista;
  month: string;
  tipo: FiltroTipo;
  seg: Segmento;
  /** Movimientos de todos los meses en lugar de solo el elegido. */
  todoElHistorial: boolean;
  /**
   * Parámetros de la URL ya normalizados: sin `tab` y con `vista`/`tipo`/`seg`
   * explícitos si venían de un link viejo, para que los links nuevos no pierdan la vista.
   */
  query: FinanceQuery;
}

/** Normaliza los parámetros de la URL, aplicando el mapeo de `?tab=` si no hay `vista`. */
export function resolveQuery(query: FinanceQuery): ResolvedQuery {
  const legacy = query.vista ? undefined : TAB_LEGADO[query.tab ?? ""];
  const vista = VISTAS_VALIDAS.includes(query.vista as Vista)
    ? (query.vista as Vista)
    : (legacy?.vista ?? "resumen");
  const tipoUrl = query.tipo;
  const tipo: FiltroTipo =
    tipoUrl === "ingreso" || tipoUrl === "egreso" ? tipoUrl : (legacy?.tipo ?? "todos");
  const seg = SEGMENTOS_VALIDOS.includes(query.seg as Segmento)
    ? (query.seg as Segmento)
    : (legacy?.seg ?? "suscripciones");
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month ?? "")
    ? query.month
    : today().slice(0, 7);
  const normalized: FinanceQuery = { ...query };
  delete normalized.tab;
  if (!query.vista) {
    normalized.vista = vista;
    if (legacy?.tipo) normalized.tipo = legacy.tipo;
    if (legacy?.seg) normalized.seg = legacy.seg;
  }
  return { vista, month, tipo, seg, todoElHistorial: query.periodo === "todo", query: normalized };
}

/** Parámetros que solo tienen sentido dentro de una vista; al cambiar de vista se descartan. */
const PARAMS_DE_VISTA = ["tipo", "seg", "periodo", "status", "currency", "account", "category", "from", "to", "origin"];

/** Arma `?a=b&c=d` a partir de la URL actual y un parche (`null` borra el parámetro). */
export function buildHref(
  query: FinanceQuery,
  patch: Record<string, string | null>,
  options: { resetViewParams?: boolean } = {},
): string {
  const next: Record<string, string> = { ...query };
  delete next.tab;
  if (options.resetViewParams) for (const key of PARAMS_DE_VISTA) delete next[key];
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") delete next[key];
    else next[key] = value;
  }
  const search = new URLSearchParams(next).toString();
  return search ? `?${search}` : "?";
}

/** Link a otra vista, conservando el mes elegido. */
export function vistaHref(query: FinanceQuery, vista: Vista, extra: Record<string, string | null> = {}) {
  return buildHref(query, { vista, ...extra }, { resetViewParams: true });
}
