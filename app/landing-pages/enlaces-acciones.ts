"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual, nombreDe, usuarioActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { marcarLugar } from "@/lib/lanzamientos/enlaces-datos";

/**
 * Enlaces del lanzamiento desde el panel: tildar dónde está puesto cada link.
 * Exige owner. El cliente del lanzamiento sale de la base, nunca del formulario.
 */

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar lanzamientos");
}

export async function marcarLugarPanel(
  launchId: string,
  link: string,
  placement: string,
  marcado: boolean,
): Promise<{ error: string } | undefined> {
  await exigirOwner();
  const { data } = await supabaseAdmin().from("launches").select("client_id").eq("id", launchId).maybeSingle();
  const clientId = data?.client_id as string | undefined;
  if (!clientId) return { error: "El lanzamiento no existe" };

  const usuario = await usuarioActual();
  const r = await marcarLugar(clientId, launchId, link, placement, marcado, usuario ? nombreDe(usuario) : "Equipo synx");
  if (r) return r;
  revalidatePath(`/landing-pages/launches/${launchId}`);
  revalidatePath("/portal", "layout");
}
