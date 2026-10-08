/**
 * Colores de los gráficos: solo variables CSS de los tokens del template
 * (tienen valor claro y oscuro en app/css/default.css y dark.css).
 */
export const CHART_COLORS = {
  income: "var(--color-success-500)",
  expense: "var(--color-error-500)",
  net: "var(--color-primary-500)",
  neutral: "var(--color-background-gray-quaternary)",
} as const;

/** Paleta categórica: familias primary/brand y los iconos de badge. */
export const CHART_PALETTE = [
  "var(--color-primary-500)",
  "var(--color-badge-orange-icon-color)",
  "var(--color-badge-cyan-icon-color)",
  "var(--color-badge-violet-icon-color)",
  "var(--color-badge-pink-icon-color)",
  "var(--color-badge-sky-icon-color)",
  "var(--color-warning-500)",
  "var(--color-brand-500)",
] as const;

export function paletteColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

export const AXIS_TICK = { fill: "var(--color-text-tertiary)", fontSize: 12 } as const;
export const TOOLTIP_CURSOR_LINE = {
  stroke: "var(--color-text-tertiary)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
} as const;

/** Un punto de datos: valores planos, sin objetos anidados. */
export type ChartDatum = Record<string, string | number | boolean | null>;

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

const COMPACT = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });

/** Etiqueta corta para los ejes: 1,2 mil. */
export function compactNumber(value: number): string {
  return COMPACT.format(value);
}
