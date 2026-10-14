import { huella } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { diaDe, dominioDe, esBot } from "@/lib/lanzamientos/tipos";
import { normalizarRuta } from "@/lib/sitios/tipos";

export const dynamic = "force-dynamic";

/* Las landings viven en otros dominios: el script les pega desde afuera. */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_BYTES = 4000;

/**
 * Visitantes distintos que puede sumar una misma IP por landing y por día.
 * Alto a propósito: en datos móviles cientos de personas reales comparten IP
 * (CGNAT) y un tope bajo descontaría visitas legítimas. Solo frena a quien
 * infla el conteo cambiando el navegador declarado en cada pedido.
 */
const MAX_POR_IP = 200;

/** Siempre la misma respuesta vacía: no revela si la clave existe ni si contó. */
const listo = () => new Response(null, { status: 204, headers: CORS });

/**
 * Los UTM los manda el navegador: cualquiera puede escribir lo que quiera.
 * Se dejan letras, números y separadores comunes, y se recortan.
 */
const utm = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const limpio = v
    .replace(/[^\p{L}\p{N} _.\-|]/gu, "")
    .trim()
    .slice(0, 80);
  return limpio === "" ? null : limpio;
};

export function OPTIONS() {
  return listo();
}

/**
 * Cuenta una visita a una landing de un lanzamiento. Ruta pública (ver
 * proxy.ts): la llama `public/t.js` desde la landing.
 *
 * No guarda la IP ni el navegador, y no usa cookies. El visitante se
 * identifica con una huella (HMAC con la clave del servidor) de lanzamiento +
 * día + IP + navegador: como el día entra en la huella, no sirve para seguir
 * a nadie entre días, y sin la clave del servidor no se puede volver a la IP.
 */
export async function POST(req: Request) {
  const userAgent = req.headers.get("user-agent");
  if (esBot(userAgent)) return listo();
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return listo();

  let datos: { k?: unknown; s?: unknown; p?: unknown; r?: unknown; u?: Record<string, unknown> };
  try {
    const cuerpo = await req.text();
    if (cuerpo.length > MAX_BYTES) return listo();
    datos = JSON.parse(cuerpo);
  } catch {
    return listo();
  }

  // En Vercel el primer valor de x-forwarded-for es la IP del visitante (la
  // plataforma lo pisa: no lo controla quien hace el pedido).
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const dia = diaDe(new Date());
  const u = (datos?.u ?? {}) as Record<string, unknown>;
  const campos = {
    day: dia,
    utm_source: utm(u.utm_source),
    utm_medium: utm(u.utm_medium),
    utm_campaign: utm(u.utm_campaign),
    utm_content: utm(u.utm_content),
    referrer_host: dominioDe(typeof datos?.r === "string" ? datos.r : null),
  };

  // Proyecto conectado con el kit: clave del sitio + ruta. Cualquier landing
  // del proyecto se mide sola desde su primera visita.
  if (typeof datos?.s === "string") {
    const ruta = normalizarRuta(datos.p);
    if (!/^[a-f0-9]{32}$/.test(datos.s) || !ruta) return listo();
    await contarVisitaDeSitio(datos.s, ruta, ip, userAgent, campos);
    return listo();
  }

  const clave = typeof datos?.k === "string" ? datos.k : "";
  if (!/^[a-f0-9]{32}$/.test(clave)) return listo();

  const db = supabaseAdmin();
  const { data: pagina } = await db
    .from("launch_pages")
    .select("id, launch_id, client_id")
    .eq("track_key", clave)
    .maybeSingle();
  if (!pagina) return listo();

  const base = `${pagina.launch_id}|${dia}|${ip}`;
  const ipHash = huella("visita-ip", base)?.slice(0, 32);
  const visitante = huella("visita", `${base}|${userAgent}`)?.slice(0, 32);
  // Sin clave en el servidor no hay huella segura: no se cuenta.
  if (!ipHash || !visitante) return listo();

  const { count } = await db
    .from("launch_visits")
    .select("id", { count: "exact", head: true })
    .eq("page_id", pagina.id)
    .eq("day", dia)
    .eq("ip_hash", ipHash);
  if ((count ?? 0) >= MAX_POR_IP) return listo();

  // El primer aviso del día gana: recargar la página no suma visitas.
  const { error } = await db.from("launch_visits").upsert(
    {
      launch_id: pagina.launch_id,
      page_id: pagina.id,
      client_id: pagina.client_id,
      visitor_hash: visitante,
      ip_hash: ipHash,
      ...campos,
    },
    { onConflict: "page_id,visitor_hash,day", ignoreDuplicates: true },
  );
  if (error) console.error("[visitas] no se pudo guardar:", error.message);

  return listo();
}

/** Misma lógica que una landing suelta, pero por sitio + ruta (site_visits). */
async function contarVisitaDeSitio(
  claveSitio: string,
  ruta: string,
  ip: string,
  userAgent: string | null,
  campos: Record<string, string | null>,
) {
  const db = supabaseAdmin();
  const { data: sitio } = await db
    .from("client_sites")
    .select("id, client_id")
    .eq("site_key", claveSitio)
    .maybeSingle();
  if (!sitio) return;

  const base = `${sitio.id}|${campos.day}|${ip}`;
  const ipHash = huella("visita-ip", base)?.slice(0, 32);
  const visitante = huella("visita", `${base}|${userAgent}`)?.slice(0, 32);
  if (!ipHash || !visitante) return;

  // El tope cuenta en TODO el proyecto, no por ruta: la ruta la elige quien
  // manda el aviso, y con un tope por ruta una IP podría inventar rutas sin fin.
  const { count } = await db
    .from("site_visits")
    .select("id", { count: "exact", head: true })
    .eq("site_id", sitio.id)
    .eq("day", campos.day)
    .eq("ip_hash", ipHash);
  if ((count ?? 0) >= MAX_POR_IP) return;

  const { error } = await db.from("site_visits").upsert(
    {
      site_id: sitio.id,
      client_id: sitio.client_id,
      path: ruta,
      visitor_hash: visitante,
      ip_hash: ipHash,
      ...campos,
    },
    { onConflict: "site_id,path,visitor_hash,day", ignoreDuplicates: true },
  );
  if (error) console.error("[visitas] no se pudo guardar la visita del sitio:", error.message);
}
