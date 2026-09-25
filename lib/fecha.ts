/** Fecha de hoy en AAAA-MM-DD, hora local. Seguro para cliente y servidor. */
export function hoyISOcliente(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
