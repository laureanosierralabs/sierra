"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { validarEntregables } from "@/lib/portal/entrega";

/**
 * Lo que el owner carga para el portal del cliente: imágenes (portada de la
 * marca, flyer y banner de cada lanzamiento), entregables de cada landing,
 * qué accesos ve el cliente y los videos de soporte. Todo exige owner.
 */
type Resultado = { error: string } | { aviso: string };

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner gestiona el portal");
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

/* ───────────── Imágenes ───────────── */

/** Bucket público (las imágenes se muestran con <img>; una URL firmada vencería). */
const BUCKET = "portadas";
const IMAGENES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
// Vercel corta los pedidos en 4,5 MB: 4 MB deja margen para el resto del form.
const MAX_IMAGEN = 4 * 1024 * 1024;

/** Dónde va cada imagen: tabla y columna. */
const DESTINOS = {
  cliente: { tabla: "clients", columna: "portal_cover_url" },
  flyer: { tabla: "launches", columna: "cover_url" },
  banner: { tabla: "launches", columna: "banner_url" },
} as const;
type Destino = keyof typeof DESTINOS;

const esDestino = (v: string): v is Destino => v in DESTINOS;

/** Ruta interna de una URL pública del bucket; null si la imagen es externa. */
function rutaEnBucket(url: string | null | undefined): string | null {
  if (!url) return null;
  const marca = `/${BUCKET}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : url.slice(i + marca.length);
}

function revalidarPortal() {
  // El slug del portal no se conoce acá: se revalida todo el árbol.
  revalidatePath("/portal", "layout");
  revalidatePath("/landing-pages/clients", "layout");
  revalidatePath("/landing-pages/launches", "layout");
}

export async function subirImagenPortal(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const destino = texto(fd, "destino");
  const id = texto(fd, "id");
  if (!esDestino(destino) || !id) return { error: "Falta a dónde va la imagen" };

  const archivo = fd.get("imagen");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "No llegó ninguna imagen" };
  if (!IMAGENES.includes(archivo.type)) return { error: "Tiene que ser una imagen (PNG, JPG, WEBP o GIF)" };
  if (archivo.size > MAX_IMAGEN) return { error: "La imagen supera los 4 MB: comprimila (por ejemplo en squoosh.app) y volvé a subirla" };

  const { tabla, columna } = DESTINOS[destino];
  const db = supabaseAdmin();
  const { data: fila } = await db.from(tabla).select(columna).eq("id", id).maybeSingle();
  if (!fila) return { error: "No existe" };

  const ext = archivo.type.split("/")[1].replace("jpeg", "jpg");
  const ruta = `portal/${destino}/${id}/${Date.now()}.${ext}`;
  const { error: errSubida } = await db.storage.from(BUCKET).upload(ruta, archivo, {
    contentType: archivo.type,
    upsert: false,
  });
  if (errSubida) return { error: `No se pudo subir: ${errSubida.message}` };

  const { data: publica } = db.storage.from(BUCKET).getPublicUrl(ruta);
  const { error } = await db.from(tabla).update({ [columna]: publica.publicUrl }).eq("id", id);
  if (error) {
    await db.storage.from(BUCKET).remove([ruta]);
    return { error: `No se pudo guardar: ${error.message}` };
  }

  // La anterior se borra: nadie la ve y ocupa lugar.
  const anterior = rutaEnBucket((fila as Record<string, string | null>)[columna]);
  if (anterior) await db.storage.from(BUCKET).remove([anterior]);

  revalidarPortal();
  return { aviso: "Imagen actualizada" };
}

export async function quitarImagenPortal(destino: string, id: string): Promise<Resultado> {
  await exigirOwner();
  if (!esDestino(destino)) return { error: "Destino inválido" };
  const { tabla, columna } = DESTINOS[destino];
  const db = supabaseAdmin();
  const { data: fila } = await db.from(tabla).select(columna).eq("id", id).maybeSingle();
  if (!fila) return { error: "No existe" };

  const { error } = await db.from(tabla).update({ [columna]: null }).eq("id", id);
  if (error) return { error: `No se pudo quitar: ${error.message}` };
  const ruta = rutaEnBucket((fila as Record<string, string | null>)[columna]);
  if (ruta) await db.storage.from(BUCKET).remove([ruta]);

  revalidarPortal();
  return { aviso: "Imagen quitada" };
}

/* ───────────── Entregables de una landing ───────────── */

export async function guardarEntregables(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const pageId = texto(fd, "page_id");
  if (!pageId) return { error: "Falta la landing" };
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto(fd, "entregables") || "{}");
  } catch {
    return { error: "No se pudo leer lo cargado" };
  }

  const { data, error } = await supabaseAdmin()
    .from("launch_pages")
    .update({ deliverables: validarEntregables(crudo) })
    .eq("id", pageId)
    .select("client_id, launch_id")
    .maybeSingle();
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  if (!data) return { error: "La landing no existe" };

  revalidatePath(`/landing-pages/launches/${data.launch_id}`);
  revalidatePath("/portal", "layout");
  return { aviso: "Entregables guardados: ya se ven en el portal" };
}

/* ───────────── Accesos visibles en el portal ───────────── */

/** Marca (o desmarca) un acceso del cliente para que lo vea en su portal. */
export async function accesoEnPortal(id: string, clientId: string, visible: boolean): Promise<Resultado> {
  await exigirOwner();
  const { data, error } = await supabaseAdmin()
    .from("client_resources")
    .update({ portal_visible: visible })
    .eq("id", id)
    .eq("client_id", clientId)
    .select("id")
    .maybeSingle();
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  if (!data) return { error: "El acceso no existe" };

  revalidatePath(`/landing-pages/clients/${clientId}`);
  revalidatePath("/portal", "layout");
  return { aviso: visible ? "El cliente ve este acceso en su portal" : "El cliente ya no ve este acceso" };
}

/* ───────────── Videos de soporte ───────────── */

function urlHttp(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const u = new URL(valor.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function guardarVideoSoporte(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const titulo = texto(fd, "title");
  const url = urlHttp(fd.get("url"));
  if (!titulo || titulo.length > 80) return { error: "Poné un título (máximo 80 caracteres)" };
  if (!url) return { error: "El link tiene que empezar con http:// o https://" };

  const db = supabaseAdmin();
  const id = texto(fd, "id");
  if (id) {
    const { error } = await db.from("support_videos").update({ title: titulo, url }).eq("id", id);
    if (error) return { error: `No se pudo guardar: ${error.message}` };
  } else {
    const { data: ultimo } = await db
      .from("support_videos")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await db
      .from("support_videos")
      .insert({ title: titulo, url, position: (Number(ultimo?.position) || 0) + 1 });
    if (error) return { error: `No se pudo guardar: ${error.message}` };
  }
  revalidatePath("/landing-pages/quotes/biblioteca");
  revalidatePath("/portal", "layout");
  return { aviso: "Video guardado: se ve en todos los portales" };
}

export async function borrarVideoSoporte(id: string): Promise<void | { error: string }> {
  await exigirOwner();
  const { error } = await supabaseAdmin().from("support_videos").delete().eq("id", id);
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  revalidatePath("/landing-pages/quotes/biblioteca");
  revalidatePath("/portal", "layout");
}
