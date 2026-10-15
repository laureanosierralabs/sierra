"use server";

import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { diaDe, type TipoLanding } from "@/lib/lanzamientos/tipos";
import { leerHtml, type Chequeo, type SaludLanding } from "@/lib/lanzamientos/salud";
import { pedirSeguro } from "@/lib/sitios/pedir-seguro";

/**
 * "Verificar landings": revisa cada landing de un lanzamiento como lo haría
 * alguien antes de prender los anuncios. Solo lee: no cambia nada. Solo el
 * owner (pide URLs desde el servidor).
 */

interface Pagina {
  id: string;
  name: string;
  url: string | null;
  kind: TipoLanding;
  thanks_url: string | null;
  whatsapp_url: string | null;
  checkout_url: string | null;
  mailerlite_group_id: string | null;
  track_key: string;
  site_id: string | null;
  path: string | null;
}

const DIA_MS = 86_400_000;
const numero = (n: number) => n.toLocaleString("es-AR");

async function contar(consulta: PromiseLike<{ count: number | null; error: unknown }>): Promise<number | null> {
  const { count, error } = await consulta;
  return error ? null : (count ?? 0);
}

async function revisarLink(id: string, etiqueta: string, url: string): Promise<Chequeo> {
  const r = await pedirSeguro(url);
  if (r.error) return { id, etiqueta, estado: "error", detalle: r.error };
  if (r.status && r.status < 400) return { id, etiqueta, estado: "ok", detalle: `Responde (${r.status})` };
  return { id, etiqueta, estado: "error", detalle: `Responde con error ${r.status}` };
}

async function revisarLanding(p: Pagina, clientId: string): Promise<SaludLanding> {
  const db = supabaseAdmin();
  const chequeos: Chequeo[] = [];
  const hace = (dias: number) => new Date(Date.now() - dias * DIA_MS);

  // Los links se revisan en paralelo con la página: el peor caso es un solo
  // tiempo máximo por landing, no la suma.
  const links = [
    { id: "gracias", etiqueta: "Página de gracias", url: p.thanks_url },
    { id: "whatsapp", etiqueta: "Link de WhatsApp", url: p.whatsapp_url },
    { id: "checkout-link", etiqueta: "Link de checkout", url: p.checkout_url },
  ].filter((l): l is { id: string; etiqueta: string; url: string } => Boolean(l.url));
  const revisionLinks = Promise.all(links.map((l) => revisarLink(l.id, l.etiqueta, l.url)));

  if (!p.url) {
    chequeos.push({ id: "responde", etiqueta: "La página responde", estado: "error", detalle: "No tiene URL cargada" });
  } else {
    const r = await pedirSeguro(p.url, { cuerpo: true });
    if (r.error || !r.status || r.status >= 400) {
      chequeos.push({
        id: "responde",
        etiqueta: "La página responde",
        estado: "error",
        detalle: r.error ?? `Responde con error ${r.status}`,
      });
    } else {
      chequeos.push({
        id: "responde",
        etiqueta: "La página responde",
        estado: r.ms > 4000 ? "aviso" : "ok",
        detalle: r.ms > 4000 ? `Tarda ${(r.ms / 1000).toFixed(1)} s en responder` : `Responde en ${(r.ms / 1000).toFixed(1)} s`,
      });
      const html = r.html ? leerHtml(r.html, p.track_key) : null;

      // El formulario no se busca en el HTML: muchas landings lo abren en un
      // modal con JavaScript y daría un falso aviso. La prueba real es
      // "Registra a quien se anota", que mira si llegaron registros.
      if (html && !p.site_id) {
        chequeos.push(
          html.scriptVisitas
            ? { id: "script", etiqueta: "Tiene el script de visitas", estado: "ok", detalle: "Con la clave de esta landing" }
            : {
                id: "script",
                etiqueta: "Tiene el script de visitas",
                estado: "error",
                detalle: "No se encontró el script con la clave de esta landing: copialo desde Configuración",
              },
        );
      }
      if (html) {
        chequeos.push(
          html.imagen && html.titulo
            ? { id: "compartir", etiqueta: "Se ve bien al compartirla", estado: "ok", detalle: html.titulo }
            : {
                id: "compartir",
                etiqueta: "Se ve bien al compartirla",
                estado: "aviso",
                detalle: html.titulo ? "Falta la imagen para compartir (og:image)" : "Falta título e imagen para compartir",
              },
        );
      }
    }
  }

  // Visitas: el kit (proyecto conectado) o el script suelto.
  const visitas = p.site_id
    ? await contar(
        db
          .from("site_visits")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId)
          .eq("site_id", p.site_id)
          .eq("path", p.path ?? "")
          .gte("day", diaDe(hace(7))),
      )
    : await contar(
        db
          .from("launch_visits")
          .select("id", { count: "exact", head: true })
          .eq("page_id", p.id)
          .gte("day", diaDe(hace(7))),
      );
  chequeos.push(
    visitas === null
      ? { id: "visitas", etiqueta: "Mide visitas", estado: "aviso", detalle: "No se pudieron leer las visitas" }
      : visitas > 0
        ? { id: "visitas", etiqueta: "Mide visitas", estado: "ok", detalle: `${numero(visitas)} visitas en los últimos 7 días` }
        : {
            id: "visitas",
            etiqueta: "Mide visitas",
            estado: "aviso",
            detalle: "Sin visitas en 7 días: abrila en una ventana de incógnito y volvé a verificar",
          },
  );

  // Conversiones: lo que esa landing tiene que producir.
  if (p.kind === "venta") {
    if (!p.checkout_url) {
      chequeos.push({ id: "checkout", etiqueta: "Checkout", estado: "aviso", detalle: "No tiene link de checkout cargado" });
    }
    const ventas = p.site_id
      ? await contar(
          db
            .from("site_conversions")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .eq("site_id", p.site_id)
            .eq("path", p.path ?? "")
            .eq("kind", "purchase"),
        )
      : null;
    chequeos.push(
      !p.site_id
        ? {
            id: "conversiones",
            etiqueta: "Mide ventas",
            estado: "aviso",
            detalle: "Las ventas no se miden: el pago pasa por un checkout que no avisa al panel",
          }
        : ventas
          ? { id: "conversiones", etiqueta: "Mide ventas", estado: "ok", detalle: `${numero(ventas)} ventas registradas` }
          : {
              id: "conversiones",
              etiqueta: "Mide ventas",
              estado: "aviso",
              detalle: "Todavía no llegó ninguna venta. Si el pago es en otro sitio (Stripe, Hotmart), no se va a medir sola.",
            },
    );
  } else {
    const registros = p.site_id
      ? await contar(
          db
            .from("site_conversions")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .eq("site_id", p.site_id)
            .eq("path", p.path ?? "")
            .eq("kind", "lead"),
        )
      : p.mailerlite_group_id
        ? await contar(
            db.from("launch_registrations").select("id", { count: "exact", head: true }).eq("page_id", p.id),
          )
        : null;
    chequeos.push(
      !p.site_id && !p.mailerlite_group_id
        ? {
            id: "conversiones",
            etiqueta: "Registra a quien se anota",
            estado: "error",
            detalle: "No está conectada a nada: elegí el proyecto conectado o un grupo de MailerLite",
          }
        : registros
          ? {
              id: "conversiones",
              etiqueta: "Registra a quien se anota",
              estado: "ok",
              detalle: `${numero(registros)} registros recibidos`,
            }
          : {
              id: "conversiones",
              etiqueta: "Registra a quien se anota",
              estado: "aviso",
              detalle: "Todavía no llegó ningún registro: completá el formulario con un mail de prueba",
            },
    );
  }

  chequeos.push(...(await revisionLinks));

  return { id: p.id, name: p.name, url: p.url, chequeos };
}

export async function verificarLandings(
  launchId: string,
): Promise<{ error: string } | { landings: SaludLanding[]; revisado: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "No autorizado" };
  const { esOwner } = await accesoActual();
  if (!esOwner) return { error: "Solo el owner puede verificar landings" };

  const db = supabaseAdmin();
  const { data: lanzamiento } = await db.from("launches").select("client_id").eq("id", launchId).maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };
  const clientId = lanzamiento.client_id as string;

  const { data: paginas, error } = await db
    .from("launch_pages")
    .select("id, name, url, kind, thanks_url, whatsapp_url, checkout_url, mailerlite_group_id, track_key, site_id, path")
    .eq("launch_id", launchId)
    .eq("client_id", clientId)
    .order("position");
  if (error) return { error: "No se pudieron leer las landings" };
  if (!paginas?.length) return { error: "El lanzamiento no tiene landings" };

  // De a 6 landings a la vez: rápido sin martillar el sitio del cliente. Si
  // una falla por algo inesperado, las demás se muestran igual.
  const landings: SaludLanding[] = [];
  const lista = paginas as Pagina[];
  for (let i = 0; i < lista.length; i += 6) {
    landings.push(
      ...(await Promise.all(
        lista.slice(i, i + 6).map((p) =>
          revisarLanding(p, clientId).catch(() => ({
            id: p.id,
            name: p.name,
            url: p.url,
            chequeos: [
              { id: "falla", etiqueta: "Verificación", estado: "aviso" as const, detalle: "No se pudo verificar: probá de nuevo" },
            ],
          })),
        ),
      )),
    );
  }
  return { landings, revisado: new Date().toISOString() };
}
