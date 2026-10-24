import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { normalizarEmail } from "@/lib/lanzamientos/listas";
import { diaDe, esBot } from "@/lib/lanzamientos/tipos";
import {
  AVISO_GRUPOS_LIBRES,
  grupoDestino,
  gruposLibres,
  personaDe,
  type GrupoWhatsapp,
} from "@/lib/lanzamientos/grupos";
import { avisarPocosGrupos } from "@/lib/lanzamientos/grupos-aviso";

export const dynamic = "force-dynamic";

/**
 * Personas anotadas por lanzamiento y día: holgado para un lanzamiento real.
 * El link es público (está en la landing): sin tope, alguien podría "llenar"
 * todos los grupos a clics. Pasado el tope se redirige igual, sin anotar.
 */
const MAX_POR_DIA = 20_000;

type Contexto = { params: Promise<{ token: string }> };

/**
 * Link fijo del grupo de WhatsApp de un lanzamiento. Ruta pública (ver
 * proxy.ts): la protege el token del lanzamiento, que no es adivinable.
 *
 *   GET /g/<token>?e=<email>  → anota a la persona y redirige (302) a su grupo
 *
 * En la landing y en los mails va con el dominio del cliente
 * (<landing>/grupo/<token>): la landing lo reenvía acá. Quien ya fue mandado
 * a un grupo vuelve siempre al mismo. Anotar nunca bloquea la entrada: si la
 * base falla, igual se redirige al grupo vigente.
 */
export async function GET(req: Request, { params }: Contexto) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) return pagina("No encontramos este link", "Revisá que esté completo.", 404);

  const db = supabaseAdmin();
  const { data: lanzamiento } = await db
    .from("launches")
    .select("id, client_id, name")
    .eq("group_token", token)
    .maybeSingle();
  if (!lanzamiento) return pagina("No encontramos este link", "Revisá que esté completo.", 404);

  const { data: filas } = await db
    .from("launch_whatsapp_groups")
    .select("id, url, position, cap, joins, full_at")
    .eq("launch_id", lanzamiento.id)
    .order("position");
  const grupos = (filas ?? []).map((g) => ({ ...g, joins: Number(g.joins), cap: Number(g.cap) })) as GrupoWhatsapp[];
  if (grupos.length === 0) {
    return pagina("El grupo todavía no está disponible", "Volvé a intentarlo en un rato.");
  }

  const email = normalizarEmail(new URL(req.url).searchParams.get("e"));
  const persona = personaDe(email, randomUUID());

  // Quien ya fue mandado a un grupo de este lanzamiento vuelve al mismo.
  if (email) {
    const { data: previo } = await db
      .from("launch_group_joins")
      .select("group_id")
      .eq("launch_id", lanzamiento.id)
      .eq("persona", persona)
      .maybeSingle();
    const suyo = previo ? grupos.find((g) => g.id === previo.group_id) : null;
    if (suyo) return redirigir(suyo.url);
  }

  const destino = grupoDestino(grupos)!;

  // Los previsualizadores de correo abren el link antes que la persona, y un
  // HEAD es un verificador de links: ninguno cuenta.
  const hoy = diaDe(new Date());
  const { count: hoyAnotados } = await db
    .from("launch_group_joins")
    .select("id", { count: "exact", head: true })
    .eq("launch_id", lanzamiento.id)
    .eq("day", hoy);
  const bajoElTope = (hoyAnotados ?? 0) < MAX_POR_DIA;

  if (bajoElTope && req.method !== "HEAD" && !esBot(req.headers.get("user-agent"))) {
    const { error } = await db.from("launch_group_joins").insert({
      launch_id: lanzamiento.id,
      group_id: destino.id,
      persona,
      email,
      day: hoy,
    });
    // 23505 = ya estaba anotada (dos clics casi juntos): lo esperado.
    if (error && error.code !== "23505") console.error("[grupos] no se pudo anotar:", error.message);

    if (!error) {
      // El cierre lo hace la base al sumar (trigger). Acá solo se avisa, una
      // vez: la condición alerted_at is null deja pasar a una sola request.
      const { data: cerrado } = await db
        .from("launch_whatsapp_groups")
        .update({ alerted_at: new Date().toISOString() })
        .eq("id", destino.id)
        .not("full_at", "is", null)
        .is("alerted_at", null)
        .select("id")
        .maybeSingle();
      if (cerrado) {
        const libres = gruposLibres(grupos.map((g) => (g.id === destino.id ? { ...g, full_at: "ahora" } : g)));
        if (libres <= AVISO_GRUPOS_LIBRES) {
          after(() =>
            avisarPocosGrupos({ launchId: lanzamiento.id as string, clientId: lanzamiento.client_id as string, nombre: lanzamiento.name as string, libres }),
          );
        }
      }
    }
  }

  return redirigir(destino.url);
}

function redirigir(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function pagina(titulo: string, detalle: string, estado = 200) {
  // Estilos en línea: esta ruta no pasa por el layout del panel ni del portal.
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Grupo de WhatsApp</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:100%;max-width:26rem}
h1{margin:0 0 .75rem;font-size:1.5rem;line-height:1.2;font-weight:800;letter-spacing:-.02em}
p{margin:0;color:rgba(255,255,255,.65);line-height:1.5;font-size:.95rem}
</style>
</head>
<body><main><h1>${escapar(titulo)}</h1><p>${escapar(detalle)}</p></main></body>
</html>`;
  return new Response(html, {
    status: estado,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
