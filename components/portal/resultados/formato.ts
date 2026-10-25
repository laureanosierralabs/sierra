/** Formatos compartidos de la vista de resultados del portal (es-AR, hora de Buenos Aires). */

export const numero = (n: number) => n.toLocaleString("es-AR");
export const porcentaje = (p: number | null) => (p === null ? "—" : `${p.toLocaleString("es-AR")}%`);
export const monto = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

/** 2026-10-21 → 21/10 */
export const diaCorto = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

const DIA_LARGO = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** 2026-10-21 → "mié, 21 oct" */
export const diaLargo = (dia: string) => DIA_LARGO.format(new Date(`${dia}T12:00:00Z`));

/** Tarjeta base del portal: vidrio oscuro con borde sutil. */
export const TARJETA = "rounded-2xl bg-white/4 ring-1 ring-white/10";

/** Colores de los datos (legibles sobre el fondo casi negro del portal). */
export const COLOR_REGISTROS = "#5073ff";
export const COLOR_VISITAS = "rgba(255,255,255,0.62)";
export const COLORES_FUENTES = ["#5073ff", "#ffffff", "#2d3cff", "#a9b8ff", "#7d8197", "#3b3f55", "#586072"] as const;
