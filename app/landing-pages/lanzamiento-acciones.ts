"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { cifrar, hayClave } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { ESTADOS_LANZAMIENTO, type EstadoLanzamiento } from "@/lib/lanzamientos/tipos";
import { normalizarRuta } from "@/lib/sitios/tipos";

/**
 * Gestión de lanzamientos desde el panel. Todo exige owner. Los fallos se
 * devuelven como `{ error }` (en producción Next oculta el mensaje de un
 * Error lanzado).
 */
type Resultado = { error: string } | undefined;

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar lanzamientos");
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
const opcional = (fd: FormData, campo: string) => texto(fd, campo) || null;

function fecha(fd: FormData, campo: string): string | null | undefined {
  const v = texto(fd, campo);
  if (v === "") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

/** Solo http/https: estos links se muestran clickeables en el portal. */
function enlace(fd: FormData, campo: string): string | null | undefined {
  const v = texto(fd, campo);
  if (v === "") return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function revalidar(clientId: string, launchId?: string) {
  revalidatePath(`/landing-pages/clients/${clientId}`);
  if (launchId) revalidatePath(`/landing-pages/launches/${launchId}`);
}

export async function guardarLanzamiento(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const nombre = texto(fd, "name");
  if (!nombre) return { error: "Falta el nombre del lanzamiento" };

  const estado = (texto(fd, "status") || "preparacion") as EstadoLanzamiento;
  if (!ESTADOS_LANZAMIENTO.includes(estado)) return { error: "Estado inválido" };

  const inicio = fecha(fd, "starts_on");
  const fin = fecha(fd, "ends_on");
  if (inicio === undefined || fin === undefined) return { error: "Fecha inválida" };
  if (inicio && fin && fin < inicio) return { error: "El cierre no puede ser anterior al inicio" };

  const metaCruda = texto(fd, "goal_registrations");
  const meta = metaCruda === "" ? null : Number(metaCruda);
  if (meta !== null && (!Number.isInteger(meta) || meta <= 0)) {
    return { error: "La meta tiene que ser un número entero mayor a cero" };
  }

  const fila = {
    name: nombre,
    status: estado,
    starts_on: inicio,
    ends_on: fin,
    goal_registrations: meta,
    updated_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  const id = texto(fd, "id");

  if (id) {
    const { data, error } = await db.from("launches").update(fila).eq("id", id).select("client_id").maybeSingle();
    if (error || !data) return { error: `No se pudo guardar: ${error?.message ?? "no existe"}` };
    revalidar(data.client_id as string, id);
    return;
  }

  const clientId = texto(fd, "client_id");
  if (!clientId) return { error: "Falta el cliente" };

  const { error } = await db.from("launches").insert({
    ...fila,
    client_id: clientId,
    webhook_token: randomBytes(24).toString("base64url"),
  });
  if (error) return { error: `No se pudo crear: ${error.message}` };
  revalidar(clientId);
}

export async function borrarLanzamiento(id: string): Promise<Resultado> {
  await exigirOwner();
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .delete()
    .eq("id", id)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  if (data) revalidar(data.client_id as string, id);
}

export async function guardarPaginaLanzamiento(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const launchId = texto(fd, "launch_id");
  const nombre = texto(fd, "name");
  if (!launchId) return { error: "Falta el lanzamiento" };
  if (!nombre) return { error: "Falta el nombre de la landing" };

  const links = {
    url: enlace(fd, "url"),
    thanks_url: enlace(fd, "thanks_url"),
    whatsapp_url: enlace(fd, "whatsapp_url"),
    checkout_url: enlace(fd, "checkout_url"),
  };
  if (Object.values(links).includes(undefined)) {
    return { error: "Los links tienen que empezar con http:// o https://" };
  }

  const db = supabaseAdmin();
  // El cliente sale del lanzamiento, nunca del form: es la clave de aislamiento.
  const { data: lanzamiento } = await db
    .from("launches")
    .select("client_id")
    .eq("id", launchId)
    .maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };
  const clientId = lanzamiento.client_id as string;

  // El proyecto tiene que ser de ESTE cliente: el id viene del navegador.
  const projectId = opcional(fd, "project_id");
  if (projectId) {
    const { data: proyecto } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!proyecto) return { error: "Ese proyecto no es de este cliente" };
  }

  // Ruta de un proyecto conectado: el proyecto tiene que ser de ESTE cliente.
  const siteId = opcional(fd, "site_id");
  const ruta = siteId ? normalizarRuta(texto(fd, "path")) : null;
  if (siteId) {
    if (!ruta) return { error: "Indicá la ruta de la landing en el proyecto (por ejemplo /registro-a)" };
    const { data: sitio } = await db
      .from("client_sites")
      .select("id")
      .eq("id", siteId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!sitio) return { error: "Ese proyecto conectado no es de este cliente" };
  }

  const fila = {
    name: nombre,
    ...links,
    site_id: siteId,
    path: ruta,
    project_id: projectId,
    // Con proyecto conectado, los registros llegan por el kit: el grupo de
    // MailerLite duplicaría a cada persona.
    mailerlite_group_id: siteId ? null : opcional(fd, "mailerlite_group_id"),
  };

  const id = texto(fd, "id");
  const repetido =
    "Ese grupo de MailerLite o esa ruta del proyecto ya está asignada a otra landing de este lanzamiento";

  if (id) {
    const { error } = await db.from("launch_pages").update(fila).eq("id", id).eq("launch_id", launchId);
    if (error) return { error: error.code === "23505" ? repetido : `No se pudo guardar: ${error.message}` };
  } else {
    const { count } = await db
      .from("launch_pages")
      .select("id", { count: "exact", head: true })
      .eq("launch_id", launchId);
    const { error } = await db
      .from("launch_pages")
      .insert({ ...fila, launch_id: launchId, client_id: clientId, position: count ?? 0 });
    if (error) return { error: error.code === "23505" ? repetido : `No se pudo crear: ${error.message}` };
  }

  revalidar(clientId, launchId);
}

export async function borrarPaginaLanzamiento(id: string): Promise<Resultado> {
  await exigirOwner();
  const { data, error } = await supabaseAdmin()
    .from("launch_pages")
    .delete()
    .eq("id", id)
    .select("client_id, launch_id")
    .maybeSingle();
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  if (data) revalidar(data.client_id as string, data.launch_id as string);
}

export interface GrupoMailerlite {
  id: string;
  name: string;
}

/**
 * Crea el webhook en la cuenta de MailerLite del cliente y guarda su secreto
 * de firma (cifrado). La API key se usa en esta llamada y NO se guarda: para
 * recibir registros no hace falta, y así no custodiamos la llave de la cuenta
 * de mail del cliente. Devuelve los grupos de la cuenta para mapear landings.
 */
export async function conectarMailerlite(
  fd: FormData,
): Promise<{ error: string } | { grupos: GrupoMailerlite[] }> {
  await exigirOwner();

  const launchId = texto(fd, "launch_id");
  const apiKey = texto(fd, "api_key");
  if (!launchId) return { error: "Falta el lanzamiento" };
  if (!apiKey) return { error: "Pegá la API key de MailerLite" };
  if (!hayClave()) return { error: "Falta configurar CREDENTIALS_KEY en el servidor para cifrar el secreto" };

  const db = supabaseAdmin();
  const { data: lanzamiento } = await db
    .from("launches")
    .select("client_id, name, webhook_token, mailerlite_webhook_id")
    .eq("id", launchId)
    .maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };

  const cabeceras = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const api = "https://connect.mailerlite.com/api";

  try {
    if (!lanzamiento.mailerlite_webhook_id) {
      const h = await headers();
      const host = h.get("x-forwarded-host") ?? h.get("host");
      if (!host) return { error: "No se pudo determinar la URL pública del panel" };
      const url = `https://${host}/api/webhooks/mailerlite/${lanzamiento.webhook_token}`;

      const res = await fetch(`${api}/webhooks`, {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({
          name: `Sierra Labs · ${lanzamiento.name}`,
          events: ["subscriber.added_to_group"],
          url,
          enabled: true,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const cuerpo = (await res.json().catch(() => null)) as {
        data?: { id?: string | number; secret?: string };
        message?: string;
      } | null;
      if (!res.ok || !cuerpo?.data?.id || !cuerpo.data.secret) {
        const detalle = cuerpo?.message ?? `HTTP ${res.status}`;
        return { error: `MailerLite no creó el webhook: ${detalle}` };
      }

      const { error } = await db
        .from("launches")
        .update({
          mailerlite_webhook_id: String(cuerpo.data.id),
          webhook_secret_encrypted: cifrar(cuerpo.data.secret),
          updated_at: new Date().toISOString(),
        })
        .eq("id", launchId);
      if (error) {
        // Sin guardar el secreto no se puede validar la firma: se borra el
        // webhook recién creado para no dejarlo huérfano en la cuenta del cliente.
        await fetch(`${api}/webhooks/${cuerpo.data.id}`, {
          method: "DELETE",
          headers: cabeceras,
          signal: AbortSignal.timeout(10_000),
        }).catch(() => undefined);
        return { error: `No se pudo guardar la conexión: ${error.message}` };
      }
    }

    const resGrupos = await fetch(`${api}/groups?limit=100`, {
      headers: cabeceras,
      signal: AbortSignal.timeout(10_000),
    });
    const grupos = (await resGrupos.json().catch(() => null)) as {
      data?: { id: string | number; name: string }[];
    } | null;

    revalidar(lanzamiento.client_id as string, launchId);
    return { grupos: (grupos?.data ?? []).map((g) => ({ id: String(g.id), name: g.name })) };
  } catch (e) {
    return { error: `No se pudo hablar con MailerLite: ${e instanceof Error ? e.message : "error de red"}` };
  }
}
