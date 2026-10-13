import { createHmac, timingSafeEqual } from "node:crypto";
import { descifrar } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { registrosDeMailerlite } from "@/lib/lanzamientos/tipos";

export const dynamic = "force-dynamic";

/* Un lote de MailerLite pesa pocos KB; más que esto no es un envío legítimo. */
const MAX_BYTES = 1_000_000;

function iguales(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * MailerLite firma el cuerpo con HMAC-SHA256 y el secreto del webhook. La
 * documentación no fija la codificación, así que se acepta hex o base64.
 */
function firmaValida(cuerpo: string, secreto: string, recibida: string): boolean {
  if (!recibida) return false;
  const hmac = createHmac("sha256", secreto).update(cuerpo);
  const digest = hmac.digest();
  return iguales(recibida, digest.toString("hex")) || iguales(recibida, digest.toString("base64"));
}

/**
 * Recibe los registros de un lanzamiento. Ruta pública (ver proxy.ts): la
 * protegen el token de la URL y, si el webhook se creó desde el panel, la
 * firma de MailerLite.
 *
 * Solo escucha: el formulario sigue enviando a MailerLite como siempre. Si
 * esto falla, el cliente no pierde ningún registro.
 */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = supabaseAdmin();

  const { data: lanzamiento } = await db
    .from("launches")
    .select("id, client_id, webhook_secret_encrypted")
    .eq("webhook_token", token)
    .maybeSingle();
  // Token desconocido: 404 sin registrar nada (no hay a qué lanzamiento atribuirlo).
  if (!lanzamiento) return new Response("No encontrado", { status: 404 });

  const anotar = (campos: { signature_ok: boolean | null; events?: number; stored?: number; error?: string }) =>
    db.from("webhook_log").insert({ launch_id: lanzamiento.id, provider: "mailerlite", ...campos });

  // Primero el tamaño declarado, para no leer un cuerpo enorme.
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) {
    await anotar({ signature_ok: null, error: "Cuerpo demasiado grande" });
    return new Response("Demasiado grande", { status: 413 });
  }
  const cuerpo = await req.text();
  if (Buffer.byteLength(cuerpo) > MAX_BYTES) {
    await anotar({ signature_ok: null, error: "Cuerpo demasiado grande" });
    return new Response("Demasiado grande", { status: 413 });
  }

  let firmaOk: boolean | null = null;
  if (lanzamiento.webhook_secret_encrypted) {
    const secreto = descifrar(lanzamiento.webhook_secret_encrypted as string);
    firmaOk = secreto ? firmaValida(cuerpo, secreto, req.headers.get("signature") ?? "") : false;
    if (!firmaOk) {
      await anotar({ signature_ok: false, error: "Firma inválida" });
      return new Response("Firma inválida", { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(cuerpo);
  } catch {
    await anotar({ signature_ok: firmaOk, error: "JSON inválido" });
    return new Response("JSON inválido", { status: 400 });
  }

  const entrantes = registrosDeMailerlite(payload);
  // El aviso llega cuando la persona entra al grupo: ese es el momento del
  // registro. Un reintento no lo pisa (el upsert ignora duplicados).
  const recibido = new Date().toISOString();

  const { data: paginas } = await db
    .from("launch_pages")
    .select("id, mailerlite_group_id")
    .eq("launch_id", lanzamiento.id);
  const paginaPorGrupo = new Map(
    (paginas ?? [])
      .filter((p) => p.mailerlite_group_id)
      .map((p) => [p.mailerlite_group_id as string, p.id as string]),
  );

  // Solo cuentan los grupos mapeados a una landing del lanzamiento: un
  // webhook de MailerLite avisa de TODOS los grupos de la cuenta.
  const filas = entrantes
    .filter((r) => paginaPorGrupo.has(r.groupId))
    .map((r) => ({
      launch_id: lanzamiento.id,
      client_id: lanzamiento.client_id,
      page_id: paginaPorGrupo.get(r.groupId),
      external_id: r.externalId,
      email: r.email,
      name: r.name,
      phone: r.phone,
      source: "mailerlite",
      utm_source: r.utm.source,
      utm_medium: r.utm.medium,
      utm_campaign: r.utm.campaign,
      utm_content: r.utm.content,
      registered_at: recibido,
    }));

  if (filas.length > 0) {
    // Reintentos y personas que pasan por dos landings: no duplican.
    const { error } = await db
      .from("launch_registrations")
      .upsert(filas, { onConflict: "launch_id,external_id", ignoreDuplicates: true });
    if (error) {
      await anotar({ signature_ok: firmaOk, events: entrantes.length, error: error.message });
      // 500: MailerLite reintenta (10 s, 100 s, 1000 s) y el registro no se pierde.
      return new Response("No se pudo guardar", { status: 500 });
    }
  }

  await anotar({ signature_ok: firmaOk, events: entrantes.length, stored: filas.length });
  return Response.json({ ok: true });
}
