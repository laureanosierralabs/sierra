import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { IntegracionUI, LandingOpcion, ResultadoSync } from "./tipos";

/**
 * Lectura para la ficha del cliente. El token cifrado NUNCA se selecciona
 * acá: solo se pregunta si existe, para que no pueda llegar al navegador.
 */
export async function integracionGhlDeCliente(
  clientId: string,
): Promise<{ integracion: IntegracionUI | null; landings: LandingOpcion[] }> {
  const db = supabaseAdmin();

  const [{ data: fila }, { data: lanzamientos }] = await Promise.all([
    db
      .from("client_integrations")
      .select("id, location_id, last_sync_at, last_sync_result")
      .eq("client_id", clientId)
      .eq("provider", "ghl")
      .maybeSingle(),
    db.from("launches").select("id, name").eq("client_id", clientId),
  ]);

  // Landings del cliente: las de venta primero, que son las que se mapean.
  const nombres = new Map((lanzamientos ?? []).map((l) => [l.id as string, l.name as string]));
  let landings: LandingOpcion[] = [];
  if (nombres.size > 0) {
    const { data: paginas } = await db
      .from("launch_pages")
      .select("id, launch_id, name, kind")
      .in("launch_id", [...nombres.keys()]);
    landings = (paginas ?? [])
      .map((p) => ({
        id: p.id as string,
        venta: p.kind === "venta",
        label: `${nombres.get(p.launch_id as string) ?? "Lanzamiento"} · ${p.name as string}${p.kind === "venta" ? " (venta)" : ""}`,
      }))
      .sort((a, b) => Number(b.venta) - Number(a.venta) || a.label.localeCompare(b.label))
      .map(({ id, label }) => ({ id, label }));
  }

  if (!fila) return { integracion: null, landings };

  const [{ count }, { data: mapeos }] = await Promise.all([
    db
      .from("client_integrations")
      .select("id", { count: "exact", head: true })
      .eq("id", fila.id as string)
      .not("token_encrypted", "is", null),
    db
      .from("ghl_sale_mappings")
      .select("id, tag, page_id, amount, currency")
      .eq("integration_id", fila.id as string)
      .order("created_at", { ascending: true }),
  ]);

  return {
    landings,
    integracion: {
      id: fila.id as string,
      location_id: (fila.location_id as string | null) ?? null,
      tieneToken: (count ?? 0) > 0,
      last_sync_at: (fila.last_sync_at as string | null) ?? null,
      last_sync_result: (fila.last_sync_result as ResultadoSync | null) ?? null,
      mapeos: (mapeos ?? []).map((m) => ({
        id: m.id as string,
        tag: m.tag as string,
        page_id: m.page_id as string,
        amount: m.amount === null ? null : Number(m.amount),
        currency: m.currency as string,
      })),
    },
  };
}
