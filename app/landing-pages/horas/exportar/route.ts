import { horasVisibles } from "@/lib/horas/datos";
import { csvPlanilla } from "@/lib/horas/tipos";

export const dynamic = "force-dynamic";

/**
 * CSV de las horas filtradas, con las columnas de la planilla de Wonder. Usa
 * la misma lectura que la pantalla: el equipo solo exporta lo suyo.
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const vista = await horasVisibles({
    desde: p.get("desde") ?? "",
    hasta: p.get("hasta") ?? "",
    persona: p.get("persona"),
    cliente: p.get("cliente"),
  });
  if (!vista) return new Response("No autorizado", { status: 401 });

  // Con varias personas en el archivo, la primera columna dice de quién es cada fila.
  const conPersona = new Set(vista.entradas.map((e) => e.user_id)).size > 1;
  const nombre = `horas-${p.get("desde") || "inicio"}-a-${p.get("hasta") || "hoy"}.csv`.replace(/[^\w.-]/g, "");
  return new Response(csvPlanilla(vista.entradas, conPersona), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
