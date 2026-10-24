"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual, nombreDe, usuarioActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { linksDeTexto } from "@/lib/lanzamientos/grupos";
import { agregarGrupos, borrarGrupo, marcarGrupo } from "@/lib/lanzamientos/grupos-datos";

/**
 * Grupos de WhatsApp de un lanzamiento, desde el panel. Todo exige owner. El
 * cliente del lanzamiento sale de la base, nunca del formulario.
 */
type Resultado = { error: string } | { aviso: string };

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar lanzamientos");
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

async function clienteDelLanzamiento(launchId: string): Promise<string | null> {
  if (!launchId) return null;
  const { data } = await supabaseAdmin().from("launches").select("client_id").eq("id", launchId).maybeSingle();
  return (data?.client_id as string | undefined) ?? null;
}

function revalidar(launchId: string) {
  revalidatePath(`/landing-pages/launches/${launchId}`);
  revalidatePath("/portal", "layout");
}

export async function agregarGruposPanel(fd: FormData): Promise<Resultado> {
  await exigirOwner();
  const launchId = texto(fd, "launch_id");
  const clientId = await clienteDelLanzamiento(launchId);
  if (!clientId) return { error: "El lanzamiento no existe" };

  const { links, invalidos } = linksDeTexto(texto(fd, "links"));
  if (invalidos.length > 0) return { error: `No es un link de grupo de WhatsApp: ${invalidos[0]}` };
  const usuario = await usuarioActual();
  const r = await agregarGrupos(clientId, launchId, links, usuario ? nombreDe(usuario) : "Owner");
  if ("error" in r) return r;

  revalidar(launchId);
  return {
    aviso:
      r.agregados === 0
        ? "Esos grupos ya estaban cargados"
        : `${r.agregados === 1 ? "Grupo agregado" : `${r.agregados} grupos agregados`}${r.repetidos > 0 ? ` (${r.repetidos} ya estaban)` : ""}`,
  };
}

export async function marcarGrupoPanel(launchId: string, groupId: string, lleno: boolean): Promise<{ error: string } | undefined> {
  await exigirOwner();
  const clientId = await clienteDelLanzamiento(launchId);
  if (!clientId) return { error: "El lanzamiento no existe" };
  const r = await marcarGrupo(clientId, groupId, lleno);
  if (r) return r;
  revalidar(launchId);
}

export async function borrarGrupoPanel(launchId: string, groupId: string): Promise<{ error: string } | undefined> {
  await exigirOwner();
  const clientId = await clienteDelLanzamiento(launchId);
  if (!clientId) return { error: "El lanzamiento no existe" };
  const r = await borrarGrupo(clientId, groupId);
  if (r) return r;
  revalidar(launchId);
}
