import { huella } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { validarEventoSitio } from "@/lib/lanzamientos/despues";
import { diaDe, esBot } from "@/lib/lanzamientos/tipos";

export const dynamic = "force-dynamic";

/* Las landings viven en otros dominios: el kit les pega desde afuera. */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_BYTES = 4000;

/**
 * Eventos distintos que puede sumar una misma IP por proyecto y por día. Alto
 * a propósito: en datos móviles cientos de personas reales comparten IP
 * (CGNAT). Solo frena a quien infla el conteo inventando rutas o emails.
 */
const MAX_POR_IP = 200;

/** Siempre la misma respuesta vacía: no revela si la clave existe ni si contó. */
const listo = () => new Response(null, { status: 204, headers: CORS });

export function OPTIONS() {
  return listo();
}

/**
 * Registra un clic de después del registro: al grupo de WhatsApp (en la
 * página de gracias) o a un checkout (en una página de ventas). Ruta pública
 * (ver proxy.ts): la llama el kit de la landing con el cuerpo como
 * text/plain (así el navegador no hace preflight):
 *   { s: clave del sitio, p: ruta, k: "whatsapp_click" | "checkout_click",
 *     e?: email, t?: botón o destino, u?: { utm_source, … } }
 *
 * Igual que /api/t: no guarda la IP ni el navegador y no usa cookies. Sin
 * email, la persona se identifica con una huella (HMAC con la clave del
 * servidor) de sitio + día + IP + navegador. Un clic cuenta una vez por
 * (proyecto, tipo, ruta, email o visitante, día): repetirlo no suma.
 * Nunca falla hacia el navegador: ante cualquier problema responde 204.
 */
export async function POST(req: Request) {
  try {
    const userAgent = req.headers.get("user-agent");
    if (esBot(userAgent)) return listo();
    if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return listo();

    const cuerpo = await req.text();
    if (cuerpo.length > MAX_BYTES) return listo();
    const datos = JSON.parse(cuerpo) as { s?: unknown };

    if (typeof datos?.s !== "string" || !/^[a-f0-9]{32}$/.test(datos.s)) return listo();
    const evento = validarEventoSitio(datos);
    if (!evento) return listo();

    // En Vercel el primer valor de x-forwarded-for es la IP del visitante (la
    // plataforma lo pisa: no lo controla quien hace el pedido).
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const dia = diaDe(new Date());

    const db = supabaseAdmin();
    const { data: sitio } = await db
      .from("client_sites")
      .select("id, client_id")
      .eq("site_key", datos.s)
      .maybeSingle();
    if (!sitio) return listo();

    const base = `${sitio.id}|${dia}|${ip}`;
    const ipHash = huella("evento-ip", base)?.slice(0, 32);
    const visitante = huella("evento", `${base}|${userAgent}`)?.slice(0, 32);
    // Sin clave en el servidor no hay huella segura: no se cuenta.
    if (!ipHash || !visitante) return listo();

    // El tope cuenta en TODO el proyecto, no por ruta: la ruta la elige quien
    // manda el aviso, y con un tope por ruta una IP podría inventar rutas sin fin.
    const { count } = await db
      .from("site_events")
      .select("id", { count: "exact", head: true })
      .eq("site_id", sitio.id)
      .eq("day", dia)
      .eq("ip_hash", ipHash);
    if ((count ?? 0) >= MAX_POR_IP) return listo();

    const { error } = await db.from("site_events").insert({
      site_id: sitio.id,
      client_id: sitio.client_id,
      kind: evento.kind,
      path: evento.path,
      email: evento.email,
      // Con email la persona se identifica por él; sin email, por la huella.
      visitor_hash: evento.email ? null : visitante,
      ip_hash: ipHash,
      target: evento.target,
      utm_source: evento.utm.source,
      utm_medium: evento.utm.medium,
      utm_campaign: evento.utm.campaign,
      utm_content: evento.utm.content,
      day: dia,
    });
    // 23505 = ya contó hoy (el índice único): es lo esperado, no un error.
    if (error && error.code !== "23505") console.error("[eventos] no se pudo guardar:", error.message);
  } catch (e) {
    console.error("[eventos] aviso descartado:", e instanceof Error ? e.message : e);
  }
  return listo();
}
