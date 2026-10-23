import { timingSafeEqual } from "node:crypto";
import { sincronizarTodas } from "@/lib/integraciones/ghl";

/**
 * Sincroniza las ventas de GoHighLevel de todos los clientes conectados.
 * Pública en el proxy (`/api/cron/(.*)`), protegida por
 * `Authorization: Bearer ${CRON_SECRET}`. Idempotente; si una corrida se corta
 * por tiempo, la siguiente retoma desde el cursor guardado.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function autorizado(req: Request): boolean {
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) return false;
  const recibido = Buffer.from(req.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${secreto}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function GET(req: Request) {
  if (!autorizado(req)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const resultados = await sincronizarTodas();
  return Response.json({
    ok: true,
    resultados: resultados.map((r) => ({
      cliente: r.clientId,
      completo: r.resultado.completo,
      modo: r.resultado.modo,
      porEtiqueta: r.resultado.porEtiqueta,
      errores: r.resultado.errores,
    })),
  });
}
