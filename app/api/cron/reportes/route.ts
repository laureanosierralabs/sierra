import { timingSafeEqual } from "node:crypto";
import { enviarEmail, resendConfigurado } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { correoDeReporte, hoyBuenosAires } from "@/lib/lanzamientos/reporte-diario-datos";
import type { TipoReporte } from "@/lib/lanzamientos/reporte-diario";

/**
 * Cron diario (Vercel, 12:00 UTC = 9:00 en Argentina): manda por mail el
 * resumen del día a los contactos elegidos de cada lanzamiento con el reporte
 * prendido, y un resumen final cuando el lanzamiento termina.
 *
 * Pública en el proxy, protegida por `Authorization: Bearer ${CRON_SECRET}`
 * (Vercel lo manda solo si la variable existe). Idempotente: el día (o el
 * final) se reserva en la base ANTES de enviar, así dos corridas a la vez no
 * duplican; si no salió ningún mail, la reserva se devuelve para reintentar.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface FilaLanzamiento {
  id: string;
  client_id: string;
  report_recipients: string[] | null;
  last_daily_report_on: string | null;
  ends_on: string | null;
}

interface Resultado {
  lanzamiento: string;
  tipo: TipoReporte;
  enviados: number;
  fallidos: number;
  omitido?: string;
}

function autorizado(req: Request): boolean {
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) return false;
  const recibido = Buffer.from(req.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${secreto}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

/** Manda el reporte a cada destinatario; los fallos de uno no frenan al resto. */
async function enviar(fila: FilaLanzamiento, tipo: TipoReporte): Promise<Resultado> {
  const base: Resultado = { lanzamiento: fila.id, tipo, enviados: 0, fallidos: 0 };
  const correo = await correoDeReporte(fila.client_id, fila.id, tipo);
  if (!correo) return { ...base, omitido: "lanzamiento no encontrado" };
  for (const to of fila.report_recipients ?? []) {
    const r = await enviarEmail({ to, ...correo });
    if (r.ok) base.enviados++;
    else {
      base.fallidos++;
      console.error(`[cron/reportes] no salió el mail de ${fila.id}:`, r.error);
    }
  }
  return base;
}

export async function GET(req: Request) {
  if (!autorizado(req)) return Response.json({ error: "No autorizado" }, { status: 401 });

  if (!resendConfigurado()) {
    return Response.json({ ok: true, omitido: "Resend no está configurado", resultados: [] });
  }

  const db = supabaseAdmin();
  const hoy = hoyBuenosAires();
  const resultados: Resultado[] = [];
  const COLUMNAS = "id, client_id, report_recipients, last_daily_report_on, ends_on";

  // (a) Diario: activos que todavía no recibieron el de hoy y no vencieron.
  // Uno vencido pasa al final; sus números del último día van ahí.
  const { data: diarios, error: errDiarios } = await db
    .from("launches")
    .select(COLUMNAS)
    .eq("status", "activo")
    .eq("daily_report", true)
    .or(`last_daily_report_on.is.null,last_daily_report_on.lt.${hoy}`);
  if (errDiarios) console.error("[cron/reportes] no se pudieron leer los diarios:", errDiarios.message);

  const conDestinatarios = (f: FilaLanzamiento) => (f.report_recipients ?? []).length > 0;
  const aunVigente = (f: FilaLanzamiento) => !f.ends_on || f.ends_on >= hoy;
  for (const fila of ((diarios ?? []) as FilaLanzamiento[]).filter((f) => conDestinatarios(f) && aunVigente(f))) {
    try {
      // Reserva el día: solo una corrida lo gana.
      const { data: reservado } = await db
        .from("launches")
        .update({ last_daily_report_on: hoy })
        .eq("id", fila.id)
        .or(`last_daily_report_on.is.null,last_daily_report_on.lt.${hoy}`)
        .select("id")
        .maybeSingle();
      if (!reservado) {
        resultados.push({ lanzamiento: fila.id, tipo: "diario", enviados: 0, fallidos: 0, omitido: "ya enviado hoy" });
        continue;
      }
      const r = await enviar(fila, "diario");
      if (r.enviados === 0) {
        await db.from("launches").update({ last_daily_report_on: fila.last_daily_report_on }).eq("id", fila.id);
      }
      resultados.push(r);
    } catch (e) {
      console.error(`[cron/reportes] falló el diario de ${fila.id}:`, e);
      await db
        .from("launches")
        .update({ last_daily_report_on: fila.last_daily_report_on })
        .eq("id", fila.id)
        .eq("last_daily_report_on", hoy);
      resultados.push({ lanzamiento: fila.id, tipo: "diario", enviados: 0, fallidos: 0, omitido: "error" });
    }
  }

  // (b) Final: terminó (fecha de fin pasada o cerrado) y todavía no salió.
  const { data: finales, error: errFinales } = await db
    .from("launches")
    .select(COLUMNAS)
    .neq("status", "preparacion")
    .eq("daily_report", true)
    .is("final_report_sent_at", null)
    .or(`status.eq.cerrado,ends_on.lt.${hoy}`);
  if (errFinales) console.error("[cron/reportes] no se pudieron leer los finales:", errFinales.message);

  for (const fila of ((finales ?? []) as FilaLanzamiento[]).filter(conDestinatarios)) {
    try {
      const { data: reservado } = await db
        .from("launches")
        .update({ final_report_sent_at: new Date().toISOString() })
        .eq("id", fila.id)
        .is("final_report_sent_at", null)
        .select("id")
        .maybeSingle();
      if (!reservado) {
        resultados.push({ lanzamiento: fila.id, tipo: "final", enviados: 0, fallidos: 0, omitido: "ya enviado" });
        continue;
      }
      const r = await enviar(fila, "final");
      if (r.enviados === 0) {
        await db.from("launches").update({ final_report_sent_at: null }).eq("id", fila.id);
      }
      resultados.push(r);
    } catch (e) {
      console.error(`[cron/reportes] falló el final de ${fila.id}:`, e);
      await db.from("launches").update({ final_report_sent_at: null }).eq("id", fila.id);
      resultados.push({ lanzamiento: fila.id, tipo: "final", enviados: 0, fallidos: 0, omitido: "error" });
    }
  }

  return Response.json({ ok: true, fecha: hoy, resultados });
}
