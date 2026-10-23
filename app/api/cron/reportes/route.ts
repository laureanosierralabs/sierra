import { timingSafeEqual } from "node:crypto";
import { enviarEmail, resendConfigurado } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { avisoBorradorEmail, avisoMetaEmail, metaAlcanzada } from "@/lib/lanzamientos/avisos";
import { borradorDeAnalisis } from "@/lib/lanzamientos/borrador-final";
import { lanzamientoDeCliente, lanzamientosDeCliente } from "@/lib/lanzamientos/datos";
import { emailsDeOwners } from "@/lib/lanzamientos/owners";
import { correoDeReporte, hoyBuenosAires, urlBaseDeApp } from "@/lib/lanzamientos/reporte-diario-datos";
import { totales, type TipoReporte } from "@/lib/lanzamientos/reporte-diario";

/**
 * Cron diario (Vercel, 12:00 UTC = 9:00 en Argentina):
 *  - manda por mail el resumen del día a los contactos elegidos de cada
 *    lanzamiento con el reporte prendido;
 *  - cuando un lanzamiento termina, la IA deja un borrador del reporte final y
 *    se avisa al owner para que lo revise: el final NO sale solo al cliente,
 *    sale cuando el owner lo aprueba en el panel;
 *  - avisa por mail cuando un lanzamiento activo llega a su meta de registros.
 *
 * Pública en el proxy, protegida por `Authorization: Bearer ${CRON_SECRET}`
 * (Vercel lo manda solo si la variable existe). Idempotente: el día (o el
 * final) se reserva en la base ANTES de enviar, así dos corridas a la vez no
 * duplican; si no salió ningún mail, la reserva se devuelve para reintentar.
 */
export const dynamic = "force-dynamic";
// La IA puede tardar en redactar el borrador del final.
export const maxDuration = 300;

/** Borradores de IA por corrida: los demás quedan para la corrida de mañana. */
const MAX_BORRADORES = 3;

interface FilaLanzamiento {
  id: string;
  client_id: string;
  report_recipients: string[] | null;
  last_daily_report_on: string | null;
  ends_on: string | null;
  name?: string;
}

interface Resultado {
  lanzamiento: string;
  tipo: TipoReporte | "borrador" | "meta";
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

  // (b) Final: terminó (fecha de fin pasada o cerrado) y todavía no hay
  // borrador ni salió el reporte. La IA lo redacta, se guarda y se avisa al
  // owner; el envío al cliente es manual (aprobación en el panel). Si la IA
  // falla el borrador queda vacío y se reintenta en la próxima corrida.
  const { data: finales, error: errFinales } = await db
    .from("launches")
    .select(`${COLUMNAS}, name`)
    .neq("status", "preparacion")
    .eq("daily_report", true)
    .is("final_report_sent_at", null)
    .is("final_draft", null)
    .or(`status.eq.cerrado,ends_on.lt.${hoy}`);
  if (errFinales) console.error("[cron/reportes] no se pudieron leer los finales:", errFinales.message);

  const base = urlBaseDeApp();
  const pendientes = ((finales ?? []) as FilaLanzamiento[]).filter(conDestinatarios).slice(0, MAX_BORRADORES);
  for (const fila of pendientes) {
    try {
      const ia = await borradorDeAnalisis(fila.client_id, fila.id);
      if (!ia.ok) {
        console.error(`[cron/reportes] la IA no generó el borrador de ${fila.id}:`, ia.error);
        resultados.push({ lanzamiento: fila.id, tipo: "borrador", enviados: 0, fallidos: 0, omitido: "la IA falló" });
        continue;
      }
      const { data: guardado } = await db
        .from("launches")
        .update({ final_draft: ia.texto.slice(0, 10_000), final_draft_at: new Date().toISOString() })
        .eq("id", fila.id)
        .is("final_draft", null)
        .select("id")
        .maybeSingle();
      if (!guardado) {
        resultados.push({ lanzamiento: fila.id, tipo: "borrador", enviados: 0, fallidos: 0, omitido: "ya generado" });
        continue;
      }

      const r: Resultado = { lanzamiento: fila.id, tipo: "borrador", enviados: 0, fallidos: 0 };
      const aviso = avisoBorradorEmail({
        nombre: fila.name ?? "Lanzamiento",
        url: base ? `${base}/landing-pages/launches/${fila.id}` : null,
      });
      const owners = await emailsDeOwners();
      if (owners.length === 0) console.error("[cron/reportes] no hay emails de owner para avisar del borrador de", fila.id);
      for (const to of owners) {
        const e = await enviarEmail({ to, ...aviso });
        if (e.ok) r.enviados++;
        else {
          r.fallidos++;
          console.error(`[cron/reportes] no salió el aviso del borrador de ${fila.id}:`, e.error);
        }
      }
      resultados.push(r);
    } catch (e) {
      console.error(`[cron/reportes] falló el borrador final de ${fila.id}:`, e);
      resultados.push({ lanzamiento: fila.id, tipo: "borrador", enviados: 0, fallidos: 0, omitido: "error" });
    }
  }

  // (c) Meta alcanzada: activos con meta de registros que todavía no la avisaron.
  const { data: conMeta, error: errMeta } = await db
    .from("launches")
    .select("id, client_id, name, report_recipients, goal_registrations, goal_notified_at")
    .eq("status", "activo")
    .not("goal_registrations", "is", null)
    .is("goal_notified_at", null);
  if (errMeta) console.error("[cron/reportes] no se pudieron leer las metas:", errMeta.message);

  const metas = (conMeta ?? []) as {
    id: string;
    client_id: string;
    name: string;
    report_recipients: string[] | null;
    goal_registrations: number;
    goal_notified_at: string | null;
  }[];
  const registrosPorCliente = new Map<string, Map<string, { registros: number; status: string }>>();
  for (const clientId of new Set(metas.map((m) => m.client_id))) {
    try {
      const lista = await lanzamientosDeCliente(clientId);
      registrosPorCliente.set(clientId, new Map(lista.map((l) => [l.id, { registros: l.registros, status: l.status }])));
    } catch (e) {
      console.error(`[cron/reportes] no se pudieron contar los registros del cliente ${clientId}:`, e);
    }
  }

  let owners: string[] | null = null;
  for (const m of metas) {
    const actual = registrosPorCliente.get(m.client_id)?.get(m.id);
    if (!actual) continue;
    if (!metaAlcanzada({ ...m, status: actual.status, registros: actual.registros })) continue;
    try {
      // Reserva el aviso: solo una corrida lo gana.
      const { data: reservado } = await db
        .from("launches")
        .update({ goal_notified_at: new Date().toISOString() })
        .eq("id", m.id)
        .is("goal_notified_at", null)
        .select("id")
        .maybeSingle();
      if (!reservado) continue;

      const detalle = await lanzamientoDeCliente(m.client_id, m.id);
      const t = detalle ? totales(detalle) : null;
      const { data: portal } = await db.from("client_orgs").select("slug").eq("client_id", m.client_id).maybeSingle();
      const slug = (portal?.slug as string | undefined) ?? null;
      const aviso = avisoMetaEmail({
        nombre: m.name,
        meta: m.goal_registrations,
        registros: actual.registros,
        visitantes: t?.visitantes ?? null,
        conversion: t?.conversion ?? null,
        urlPortal: base && slug ? `${base}/portal/${slug}/lanzamientos/${m.id}` : null,
      });

      owners ??= await emailsDeOwners();
      const destinos = [...new Set([...(m.report_recipients ?? []), ...owners].map((e) => e.toLowerCase()))];
      const r: Resultado = { lanzamiento: m.id, tipo: "meta", enviados: 0, fallidos: 0 };
      for (const to of destinos) {
        const e = await enviarEmail({ to, ...aviso });
        if (e.ok) r.enviados++;
        else {
          r.fallidos++;
          console.error(`[cron/reportes] no salió el aviso de meta de ${m.id}:`, e.error);
        }
      }
      if (r.enviados === 0) await db.from("launches").update({ goal_notified_at: null }).eq("id", m.id);
      resultados.push(r);
    } catch (e) {
      console.error(`[cron/reportes] falló el aviso de meta de ${m.id}:`, e);
      await db.from("launches").update({ goal_notified_at: null }).eq("id", m.id);
      resultados.push({ lanzamiento: m.id, tipo: "meta", enviados: 0, fallidos: 0, omitido: "error" });
    }
  }

  return Response.json({ ok: true, fecha: hoy, resultados });
}
