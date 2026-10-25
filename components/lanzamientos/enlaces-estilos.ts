/**
 * Clases de los bloques de Enlaces y Grupos según dónde se muestran: el portal
 * del cliente (oscuro, mismo lenguaje que Resultados) o el panel interno.
 */
export interface EstilosEnlaces {
  tarjeta: string;
  titulo: string;
  texto: string;
  suave: string;
  caja: string;
  separador: string;
  botonPrimario: string;
  botonSecundario: string;
  chip: string;
  chipOn: string;
  chipOff: string;
  input: string;
  aviso: string;
  pista: string;
  barraFondo: string;
  enlace: string;
  estadoTexto: { ok: string; espera: string; falta: string };
}

const PORTAL: EstilosEnlaces = {
  tarjeta: "rounded-2xl bg-white/4 ring-1 ring-white/10 p-5 sm:p-6",
  titulo: "text-white",
  texto: "text-white/80",
  suave: "text-white/55",
  caja: "rounded-xl bg-black/25 ring-1 ring-white/10",
  separador: "divide-white/10",
  botonPrimario: "bg-primary-500 text-white hover:bg-primary-600",
  botonSecundario: "text-white ring-1 ring-white/15 hover:bg-white/10",
  chip: "ring-1",
  chipOn: "bg-primary-500/20 text-white ring-primary-500/60",
  chipOff: "text-white/70 ring-white/15 hover:bg-white/10",
  input:
    "rounded-lg bg-black/25 px-3 py-2 text-sm text-white ring-1 ring-white/15 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-primary-500",
  aviso: "rounded-lg bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/30",
  pista: "text-white/55",
  barraFondo: "bg-white/10",
  enlace: "text-primary-400 hover:underline",
  estadoTexto: { ok: "text-emerald-300", espera: "text-amber-300", falta: "text-red-300" },
};

const PANEL: EstilosEnlaces = {
  tarjeta: "rounded-xl border border-card-border p-4 sm:p-5",
  titulo: "text-text-primary",
  texto: "text-text-primary",
  suave: "text-text-tertiary",
  caja: "rounded-lg border border-card-border",
  separador: "divide-card-border",
  botonPrimario: "bg-primary-500 text-white hover:bg-primary-600",
  botonSecundario: "border border-card-border text-text-primary hover:bg-background-gray-secondary",
  chip: "border",
  chipOn: "border-primary-500 bg-primary-500/10 text-text-primary",
  chipOff: "border-card-border text-text-secondary hover:bg-background-gray-secondary",
  input:
    "rounded-lg border border-card-border bg-input-background px-3 py-2 text-sm text-title-50 outline-none placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20",
  aviso: "rounded-lg border border-badge-warning-text/30 bg-badge-warning-background text-badge-warning-text",
  pista: "text-text-tertiary",
  barraFondo: "bg-background-gray-secondary",
  enlace: "text-primary-500 hover:underline",
  estadoTexto: { ok: "text-emerald-600", espera: "text-amber-600", falta: "text-red-600" },
};

export const estilosEnlaces = (portal: boolean): EstilosEnlaces => (portal ? PORTAL : PANEL);
