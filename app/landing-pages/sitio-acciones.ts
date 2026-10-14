"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { cifrar, descifrar, hayClave } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";

/**
 * Proyectos conectados (Sierra Launch Kit). Todo exige owner. Los fallos se
 * devuelven como `{ error }`: en producción Next oculta el mensaje de un
 * Error lanzado.
 */
type Resultado = { error: string } | undefined;

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede conectar proyectos");
}

/* 32 bytes aleatorios: el secreto con el que el proyecto firma sus avisos. */
const nuevoSecreto = () => randomBytes(32).toString("base64url");

/** "https://www.aidaqui.com/x" → "aidaqui.com". Null si no parece un dominio. */
function dominio(valor: string): string | null | undefined {
  const v = valor.trim().toLowerCase();
  if (v === "") return null;
  const limpio = v.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(limpio) ? limpio : undefined;
}

export async function conectarProyecto(fd: FormData): Promise<Resultado> {
  await exigirOwner();
  if (!hayClave()) return { error: "Falta configurar CREDENTIALS_KEY en el servidor" };

  const clientId = String(fd.get("client_id") ?? "");
  const nombre = String(fd.get("name") ?? "").trim();
  const dom = dominio(String(fd.get("domain") ?? ""));
  if (!clientId) return { error: "Falta el cliente" };
  if (!nombre) return { error: "Falta el nombre del proyecto" };
  if (dom === undefined) return { error: "El dominio no es válido (por ejemplo: aidaqui.com)" };

  const { error } = await supabaseAdmin().from("client_sites").insert({
    client_id: clientId,
    name: nombre,
    domain: dom,
    ingest_secret_encrypted: cifrar(nuevoSecreto()),
  });
  if (error) return { error: `No se pudo conectar el proyecto: ${error.message}` };
  revalidatePath(`/landing-pages/clients/${clientId}`);
}

/**
 * Cambia el secreto. El anterior deja de valer en el acto: hasta que se cargue
 * el nuevo en Vercel, los registros del proyecto no llegan al panel (el
 * formulario sigue funcionando igual).
 */
export async function regenerarSecreto(siteId: string): Promise<Resultado> {
  await exigirOwner();
  if (!hayClave()) return { error: "Falta configurar CREDENTIALS_KEY en el servidor" };
  const { data, error } = await supabaseAdmin()
    .from("client_sites")
    .update({ ingest_secret_encrypted: cifrar(nuevoSecreto()) })
    .eq("id", siteId)
    .select("client_id")
    .maybeSingle();
  if (error || !data) return { error: `No se pudo regenerar: ${error?.message ?? "no existe"}` };
  revalidatePath(`/landing-pages/clients/${data.client_id}`);
}

/** Borra la conexión con todas sus visitas y conversiones. */
export async function borrarProyectoConectado(siteId: string): Promise<Resultado> {
  await exigirOwner();
  const { data, error } = await supabaseAdmin()
    .from("client_sites")
    .delete()
    .eq("id", siteId)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  if (data) revalidatePath(`/landing-pages/clients/${data.client_id}`);
}

/**
 * Las 3 variables de entorno para Vercel, con el secreto en claro. Se piden
 * al copiarlas (no viajan en la página): el secreto no queda en el HTML.
 */
export async function variablesDeEntorno(
  siteId: string,
  urlPanel: string,
): Promise<{ error: string } | { variables: string }> {
  await exigirOwner();
  const { data } = await supabaseAdmin()
    .from("client_sites")
    .select("site_key, ingest_secret_encrypted")
    .eq("id", siteId)
    .maybeSingle();
  if (!data) return { error: "El proyecto no existe" };

  const secreto = descifrar(data.ingest_secret_encrypted as string);
  if (!secreto) return { error: "No se pudo descifrar el secreto: regeneralo" };

  // Solo el origen del panel: es lo único que necesita el kit.
  let origen: string;
  try {
    origen = new URL(urlPanel).origin;
  } catch {
    return { error: "URL del panel inválida" };
  }

  return {
    variables: [
      `NEXT_PUBLIC_SIERRA_URL=${origen}`,
      `NEXT_PUBLIC_SIERRA_SITE_KEY=${data.site_key}`,
      `SIERRA_INGEST_SECRET=${secreto}`,
    ].join("\n"),
  };
}
