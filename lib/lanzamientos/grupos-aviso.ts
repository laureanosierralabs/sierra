import "server-only";

import { enviarEmail } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { avisoPocosGruposEmail } from "@/lib/lanzamientos/avisos";
import { emailsDeOwners } from "@/lib/lanzamientos/owners";
import { leerDestinatarios, urlBaseApp } from "@/lib/lanzamientos/reporte-diario";

/**
 * Aviso de "quedan pocos grupos de WhatsApp libres": a los owners (link al
 * panel) y a los contactos del cliente que reciben el reporte (link al
 * portal, donde cargan los grupos). Nunca lanza: corre después de redirigir.
 */
export async function avisarPocosGrupos(a: { launchId: string; clientId: string; nombre: string; libres: number }) {
  try {
    const base = urlBaseApp({
      APP_URL: process.env.APP_URL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    });
    const db = supabaseAdmin();
    const [{ data: lanzamiento }, { data: portal }, owners] = await Promise.all([
      db.from("launches").select("report_recipients").eq("id", a.launchId).maybeSingle(),
      db.from("client_orgs").select("slug").eq("client_id", a.clientId).maybeSingle(),
      emailsDeOwners(),
    ]);

    const urlPanel = base ? `${base}/landing-pages/launches/${a.launchId}?vista=configuracion` : null;
    const urlPortal = base && portal?.slug ? `${base}/portal/${portal.slug}/lanzamientos/${a.launchId}?vista=entrega` : null;
    const recipientes = (lanzamiento?.report_recipients as string[] | null) ?? [];
    const leidos = leerDestinatarios(recipientes.join(","));
    const clientes = "emails" in leidos ? leidos.emails.filter((e) => !owners.includes(e)) : [];

    const envios = [
      ...owners.map((to) => ({ to, url: urlPanel })),
      ...(urlPortal ? clientes.map((to) => ({ to, url: urlPortal })) : []),
    ];
    for (const envio of envios) {
      const correo = avisoPocosGruposEmail({ nombre: a.nombre, libres: a.libres, url: envio.url });
      const r = await enviarEmail({ to: envio.to, ...correo });
      if (!r.ok) console.error("[grupos] no se pudo avisar:", r.error);
    }
  } catch (e) {
    console.error("[grupos] falló el aviso de pocos grupos:", e);
  }
}
