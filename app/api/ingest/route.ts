import { descifrar } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { firmaIngestaValida, validarConversion } from "@/lib/sitios/tipos";

export const dynamic = "force-dynamic";

const MAX_BYTES = 32_000;

const respuesta = (status: number, error?: string) =>
  Response.json(error ? { ok: false, error } : { ok: true }, { status });

/**
 * Conversiones (registros y compras) que manda el SERVIDOR de un proyecto
 * conectado con el Sierra Launch Kit (public/kit/sierra.ts). Ruta pública
 * (ver proxy.ts): la protege la firma HMAC con el secreto del proyecto y una
 * ventana de 5 minutos contra reenvíos.
 *
 * Los errores de integración se responden con su motivo: los lee quien
 * conecta el proyecto, en el log de su servidor. Un sitio desconocido y una
 * firma inválida dan la misma respuesta, para no revelar qué claves existen.
 */
export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return respuesta(413, "Cuerpo demasiado grande");
  }
  const cuerpo = await req.text();
  if (Buffer.byteLength(cuerpo) > MAX_BYTES) return respuesta(413, "Cuerpo demasiado grande");

  const clave = req.headers.get("x-sierra-site") ?? "";
  if (!/^[a-f0-9]{32}$/.test(clave)) return respuesta(401, "Firma inválida");

  const db = supabaseAdmin();
  const { data: sitio } = await db
    .from("client_sites")
    .select("id, client_id, ingest_secret_encrypted")
    .eq("site_key", clave)
    .maybeSingle();

  const secreto = sitio ? descifrar(sitio.ingest_secret_encrypted as string) : null;
  if (
    !sitio ||
    !secreto ||
    !firmaIngestaValida(
      secreto,
      req.headers.get("x-sierra-timestamp"),
      cuerpo,
      req.headers.get("x-sierra-signature"),
    )
  ) {
    return respuesta(401, "Firma inválida (revisá SIERRA_INGEST_SECRET y la hora del servidor)");
  }

  let datos: unknown;
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    return respuesta(400, "JSON inválido");
  }

  const validacion = validarConversion(datos);
  if (!validacion.ok) return respuesta(400, validacion.motivo);
  const c = validacion.conversion;

  const { error } = await db.from("site_conversions").upsert(
    {
      site_id: sitio.id,
      client_id: sitio.client_id,
      kind: c.kind,
      event_id: c.eventId,
      path: c.path,
      email: c.email,
      name: c.name,
      phone: c.phone,
      amount: c.amount,
      currency: c.currency,
      utm_source: c.utm.source,
      utm_medium: c.utm.medium,
      utm_campaign: c.utm.campaign,
      utm_content: c.utm.content,
      occurred_at: c.occurredAt,
    },
    // Un reintento con el mismo id no duplica.
    { onConflict: "site_id,event_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[ingesta] no se pudo guardar:", error.message);
    // 500: el kit lo deja en el log del proyecto; el formulario no se entera.
    return respuesta(500, "No se pudo guardar el evento");
  }

  await db
    .from("client_sites")
    .update({ last_event_at: new Date().toISOString() })
    .eq("id", sitio.id);

  return respuesta(200);
}
