export type Audiencia = "equipo" | "cliente";

/**
 * ¿Quién está entrando? Un cliente llega al login porque entró por el dominio
 * de clientes (clientes.<dominio>), porque quería ir al portal (el proxy
 * conserva la ruta en `redirect_url`) o desde su invitación (`para=cliente`).
 * Solo cambia el texto: los permisos los decide Clerk.
 */
export function audienciaDe(params: Record<string, string | string[] | undefined>, host?: string | null): Audiencia {
  const valor = (k: string) => (Array.isArray(params[k]) ? params[k][0] : params[k]) ?? "";
  if (valor("para") === "cliente") return "cliente";
  if ((host ?? "").trim().toLowerCase().startsWith("clientes.")) return "cliente";
  try {
    const destino = valor("redirect_url");
    if (destino && new URL(destino, "https://x").pathname.startsWith("/portal")) return "cliente";
  } catch {
    // redirect_url inválida: se muestra la versión del equipo.
  }
  return "equipo";
}
