import { money, type FinanceRow } from "@/lib/personal-finance";

export type Vista = "resumen" | "movimientos" | "compromisos" | "patrimonio";
export type Segmento = "suscripciones" | "programados" | "deudas" | "por-cobrar";
export type TipoMovimiento = "ingreso" | "egreso";
export type FiltroTipo = "todos" | TipoMovimiento;
export type EntidadSimple = "account" | "category" | "schedule" | "obligation" | "goal" | "milestone" | "contribution";
export type EntidadPago = "obligation" | "schedule";

/** Parámetros de búsqueda de la ruta, ya reducidos a strings. */
export type FinanceQuery = Record<string, string>;

export const VISTAS: { value: Vista; label: string }[] = [
  { value: "resumen", label: "Resumen" },
  { value: "movimientos", label: "Movimientos" },
  { value: "compromisos", label: "Compromisos" },
  { value: "patrimonio", label: "Patrimonio" },
];

export const SEGMENTOS: { value: Segmento; label: string }[] = [
  { value: "suscripciones", label: "Suscripciones" },
  { value: "programados", label: "Programados" },
  { value: "deudas", label: "Deudas" },
  { value: "por-cobrar", label: "Por cobrar" },
];

/** Etiquetas de estado, frecuencia y prioridad (mismo texto que la pantalla anterior). */
export const ETIQUETAS: Record<string, string> = {
  active: "Activo / pendiente",
  paused: "Pausado",
  cancelled: "Cancelado",
  incomplete: "Pendiente de completar",
  paid: "Pagado",
  pending: "Pendiente",
  negotiating: "En negociación",
  installments: "En cuotas",
  partial: "Parcial",
  collected: "Cobrado",
  uncollectible: "Incobrable",
  review: "Por revisar",
  completed: "Completado",
  monthly: "Mensual",
  yearly: "Anual",
  once: "Una vez",
  custom: "Personalizada",
  low: "Baja",
  medium: "Media",
  "medium-high": "Media-Alta",
  high: "Alta",
};

export type BadgeColor = "gray" | "primary" | "error" | "warning" | "success" | "blue" | "orange";

const COLOR_ESTADO: Record<string, BadgeColor> = {
  active: "success",
  paused: "gray",
  cancelled: "gray",
  incomplete: "warning",
  paid: "success",
  pending: "warning",
  negotiating: "blue",
  installments: "blue",
  partial: "orange",
  collected: "success",
  uncollectible: "error",
  review: "warning",
  completed: "success",
};

export function etiqueta(value: unknown): string {
  return ETIQUETAS[String(value)] ?? String(value ?? "");
}

export function colorEstado(status: unknown): BadgeColor {
  return COLOR_ESTADO[String(status)] ?? "gray";
}

export const COLOR_PRIORIDAD: Record<string, BadgeColor> = {
  low: "gray",
  medium: "blue",
  "medium-high": "orange",
  high: "error",
};

/** Estado visible de un movimiento: la anulación es un timestamp aparte del estado de pago. */
export function estadoMovimiento(m: FinanceRow): { label: string; color: BadgeColor } {
  if (m.cancelled_at) return { label: "Anulado", color: "gray" };
  if (m.estado === "pagado") return { label: "Pagado", color: "success" };
  if (m.estado === "cobrado") return { label: "Cobrado", color: "success" };
  return { label: "Pendiente", color: "warning" };
}

export const usd = (value: number | null) => money(value, "USD");

export function accountName(accounts: FinanceRow[], id: unknown): string {
  return String(accounts.find((a) => a.id === id)?.name ?? "Sin cuenta");
}

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
