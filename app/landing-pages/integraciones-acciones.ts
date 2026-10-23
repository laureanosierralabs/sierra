"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { cifrar, hayClave } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { sincronizarCliente } from "@/lib/integraciones/ghl";
import type { ResultadoSync } from "@/lib/integraciones/tipos";

/**
 * Integración GoHighLevel por cliente. Todo exige owner. Los fallos se
 * devuelven como `{ error }`: en producción Next oculta el mensaje de un
 * Error lanzado. El token entra por acá, se cifra y no vuelve a salir.
 */
type Resultado = { error: string } | undefined;

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar integraciones");
}

const ruta = (clientId: string) => `/landing-pages/clients/${clientId}`;

/** Guarda Location ID y, si viene, el token (vacío = conservar el actual). */
export async function guardarConexionGhl(fd: FormData): Promise<Resultado> {
  await exigirOwner();
  const clientId = String(fd.get("client_id") ?? "");
  const locationId = String(fd.get("location_id") ?? "").trim();
  const token = String(fd.get("token") ?? "").trim();
  if (!clientId) return { error: "Falta el cliente" };
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(locationId)) return { error: "El Location ID no parece válido" };
  if (token) {
    if (!hayClave()) return { error: "Falta configurar CREDENTIALS_KEY en el servidor" };
    if (token.length < 10 || /\s/.test(token)) return { error: "El token no parece válido" };
  }

  const db = supabaseAdmin();
  const valores: Record<string, unknown> = { location_id: locationId };
  if (token) valores.token_encrypted = cifrar(token);

  const { data: existente } = await db
    .from("client_integrations")
    .select("id")
    .eq("client_id", clientId)
    .eq("provider", "ghl")
    .maybeSingle();
  const { error } = existente
    ? await db.from("client_integrations").update(valores).eq("id", existente.id as string)
    : await db.from("client_integrations").insert({ client_id: clientId, provider: "ghl", ...valores });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath(ruta(clientId));
}

/** Borra solo el token guardado (la conexión y los mapeos quedan). */
export async function quitarTokenGhl(clientId: string): Promise<Resultado> {
  await exigirOwner();
  const { error } = await supabaseAdmin()
    .from("client_integrations")
    .update({ token_encrypted: null })
    .eq("client_id", clientId)
    .eq("provider", "ghl");
  if (error) return { error: `No se pudo quitar el token: ${error.message}` };
  revalidatePath(ruta(clientId));
}

/** Desconecta GoHighLevel: borra la conexión y sus mapeos (las ventas ya importadas se conservan). */
export async function desconectarGhl(clientId: string): Promise<Resultado> {
  await exigirOwner();
  const { error } = await supabaseAdmin()
    .from("client_integrations")
    .delete()
    .eq("client_id", clientId)
    .eq("provider", "ghl");
  if (error) return { error: `No se pudo desconectar: ${error.message}` };
  revalidatePath(ruta(clientId));
}

export async function agregarMapeoGhl(fd: FormData): Promise<Resultado> {
  await exigirOwner();
  const clientId = String(fd.get("client_id") ?? "");
  const tag = String(fd.get("tag") ?? "").trim();
  const pageId = String(fd.get("page_id") ?? "");
  const monto = String(fd.get("amount") ?? "").trim().replace(",", ".");
  const moneda = String(fd.get("currency") ?? "EUR").trim().toUpperCase();
  if (!clientId || !pageId) return { error: "Falta elegir la landing" };
  if (!tag) return { error: "Falta la etiqueta" };
  const amount = monto === "" ? null : Number(monto);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) return { error: "El precio no es válido" };
  if (!/^[A-Z]{3}$/.test(moneda)) return { error: "La moneda debe tener 3 letras (EUR, USD, ARS)" };

  const db = supabaseAdmin();
  const { data: integracion } = await db
    .from("client_integrations")
    .select("id")
    .eq("client_id", clientId)
    .eq("provider", "ghl")
    .maybeSingle();
  if (!integracion) return { error: "Primero guardá el Location ID" };

  // La landing tiene que ser de este cliente.
  const { data: pagina } = await db.from("launch_pages").select("launch_id").eq("id", pageId).maybeSingle();
  const { data: lanz } = pagina
    ? await db.from("launches").select("client_id").eq("id", pagina.launch_id as string).maybeSingle()
    : { data: null };
  if (!lanz || lanz.client_id !== clientId) return { error: "Esa landing no es de este cliente" };

  const { error } = await db.from("ghl_sale_mappings").insert({
    client_id: clientId,
    integration_id: integracion.id as string,
    tag,
    page_id: pageId,
    amount,
    currency: moneda,
  });
  if (error) {
    return { error: error.code === "23505" ? "Esa etiqueta ya está mapeada a esa landing" : `No se pudo guardar: ${error.message}` };
  }
  revalidatePath(ruta(clientId));
}

export async function borrarMapeoGhl(mapeoId: string): Promise<Resultado> {
  await exigirOwner();
  const { data, error } = await supabaseAdmin()
    .from("ghl_sale_mappings")
    .delete()
    .eq("id", mapeoId)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  if (data) revalidatePath(ruta(data.client_id as string));
}

/** Corre la sincronización ahora (hasta ~50 s; si no alcanza, retoma en la próxima). */
export async function sincronizarGhlAhora(clientId: string): Promise<{ error: string } | { resultado: ResultadoSync }> {
  await exigirOwner();
  try {
    const resultado = await sincronizarCliente(clientId);
    if (!resultado) return { error: "Todavía no hay una conexión de GoHighLevel" };
    revalidatePath(ruta(clientId));
    return { resultado };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo sincronizar" };
  }
}
