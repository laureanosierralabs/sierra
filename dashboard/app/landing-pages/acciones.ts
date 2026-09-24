"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { cifrar, descifrar } from "@/lib/landing/cifrado";
import { hoyISO, slugify } from "@/lib/escritura";
import { plantillaDe } from "@/lib/landing/plantillas";
import {
  ESTADOS_CLIENTE,
  ESTADOS_COTIZACION,
  ESTADOS_PROYECTO,
  ESTADOS_TAREA,
  ETAPAS,
  MONEDAS,
  ORIGENES,
  PRIORIDADES,
  TIPOS_RECURSO,
  type EstadoCliente,
  type EstadoCotizacion,
  type EstadoProyecto,
  type EstadoTarea,
  type Etapa,
  type Moneda,
  type Origen,
  type Paso,
  type PrioridadLanding,
  type TipoRecurso,
} from "@/lib/landing/tipos";

/** Toda mutación pasa por acá: sin sesión de Clerk no se escribe nada. */
async function exigirSesion() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  return userId;
}

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

function opcional(fd: FormData, campo: string): string | null {
  const v = texto(fd, campo);
  return v === "" ? null : v;
}

function fecha(fd: FormData, campo: string): string | null {
  const v = texto(fd, campo);
  if (v === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("Fecha inválida");
  return v;
}

function unaDe<T extends string>(
  valor: string,
  permitidos: readonly T[],
  etiqueta: string,
): T {
  if (!permitidos.includes(valor as T)) throw new Error(`${etiqueta} inválido`);
  return valor as T;
}

function revalidar() {
  revalidatePath("/landing-pages");
  revalidatePath("/landing-pages/projects");
  revalidatePath("/landing-pages/tasks");
  revalidatePath("/landing-pages/clients");
  revalidatePath("/landing-pages/quotes");
  revalidatePath("/landing-pages/team");
}

function monto(fd: FormData, campo: string): number | null {
  const v = texto(fd, campo);
  if (v === "") return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error("Monto inválido");
  return n;
}

/** Solo http/https: un `javascript:` en un href es XSS. */
function url(fd: FormData, campo: string): string | null {
  const v = texto(fd, campo);
  if (v === "") return null;
  let parsed: URL;
  try {
    parsed = new URL(v);
  } catch {
    throw new Error("La URL de la propuesta no es válida");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("La URL debe empezar con http:// o https://");
  }
  return parsed.toString();
}

export async function guardarProyecto(fd: FormData) {
  await exigirSesion();

  const nombre = texto(fd, "name");
  if (!nombre) throw new Error("Falta el nombre del proyecto");

  const fila = {
    name: nombre,
    client_name: opcional(fd, "client_name"),
    client_id: opcional(fd, "client_id"),
    quote_id: opcional(fd, "quote_id"),
    status: unaDe<EstadoProyecto>(texto(fd, "status"), ESTADOS_PROYECTO, "Estado"),
    stage: texto(fd, "stage")
      ? unaDe<Etapa>(texto(fd, "stage"), ETAPAS, "Etapa")
      : null,
    // El tipo lo validan los procesos existentes, no una lista en código.
    kind: texto(fd, "kind") || "wordpress",
    responsible_user_id: opcional(fd, "responsible_user_id"),
    due_date: fecha(fd, "due_date"),
    priority: unaDe<PrioridadLanding>(texto(fd, "priority"), PRIORIDADES, "Prioridad"),
    notes: opcional(fd, "notes"),
    cover_url: url(fd, "cover_url"),
    updated_at: new Date().toISOString(),
  };

  const id = opcional(fd, "id");
  const db = supabaseAdmin();

  if (id) {
    const { error } = await db.from("projects").update(fila).eq("id", id);
    if (error)
      throw new Error(`No se pudo guardar el proyecto: ${error.message}`);
    revalidar();
    revalidatePath(`/landing-pages/projects/${id}`);
    return;
  }

  const { data: creado, error } = await db
    .from("projects")
    .insert(fila)
    .select("id")
    .single();

  if (error || !creado)
    throw new Error(`No se pudo guardar el proyecto: ${error?.message ?? ""}`);

  // Las tareas salen del SOP del tipo elegido. Se copian, no se referencian:
  // editar el proceso después no debe alterar proyectos en curso.
  const { data: proceso } = await db
    .from("processes")
    .select("id")
    .eq("slug", fila.kind)
    .maybeSingle();

  if (proceso) {
    const { data: plantillaTareas } = await db
      .from("process_tasks")
      .select("title, template, steps, notes")
      .eq("process_id", proceso.id)
      .order("position");

    if (plantillaTareas?.length) {
      await db.from("tasks").insert(
        plantillaTareas.map((t, i) => ({
          project_id: creado.id,
          title: t.title,
          template: t.template,
          steps: t.steps ?? [],
          description: t.notes,
          status: "pendiente",
          priority: "media",
          position: i,
        })),
      );
    }
  }

  revalidar();
}

export async function guardarTarea(fd: FormData) {
  await exigirSesion();

  const titulo = texto(fd, "title");
  if (!titulo) throw new Error("Falta el título de la tarea");

  const fila = {
    title: titulo,
    project_id: opcional(fd, "project_id"),
    description: opcional(fd, "description"),
    status: unaDe<EstadoTarea>(texto(fd, "status"), ESTADOS_TAREA, "Estado"),
    assigned_to: opcional(fd, "assigned_to"),
    priority: unaDe<PrioridadLanding>(texto(fd, "priority"), PRIORIDADES, "Prioridad"),
    due_date: fecha(fd, "due_date"),
    updated_at: new Date().toISOString(),
  };

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("tasks").update(fila).eq("id", id)
    : await db.from("tasks").insert(fila);

  if (error) throw new Error(`No se pudo guardar la tarea: ${error.message}`);
  revalidar();
}

export async function cambiarEstadoTarea(id: string, estado: string) {
  await exigirSesion();
  const status = unaDe<EstadoTarea>(estado, ESTADOS_TAREA, "Estado");

  const { error } = await supabaseAdmin()
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  revalidar();
}

export async function cambiarEstadoProyecto(id: string, estado: string) {
  await exigirSesion();
  const status = unaDe<EstadoProyecto>(estado, ESTADOS_PROYECTO, "Estado");

  const { error } = await supabaseAdmin()
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  revalidar();
}

export async function guardarCliente(fd: FormData) {
  await exigirSesion();

  const nombre = texto(fd, "name");
  if (!nombre) throw new Error("Falta el nombre del cliente");

  const fila = {
    name: nombre,
    company: opcional(fd, "company"),
    email: opcional(fd, "email"),
    phone: opcional(fd, "phone"),
    instagram: opcional(fd, "instagram"),
    status: unaDe<EstadoCliente>(texto(fd, "status"), ESTADOS_CLIENTE, "Estado"),
    source: texto(fd, "source")
      ? unaDe<Origen>(texto(fd, "source"), ORIGENES, "Origen")
      : null,
    source_detail: opcional(fd, "source_detail"),
    niche: opcional(fd, "niche"),
    website: url(fd, "website"),
    drive_url: url(fd, "drive_url"),
    notes: opcional(fd, "notes"),
    updated_at: new Date().toISOString(),
  };

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("clients").update(fila).eq("id", id)
    : await db.from("clients").insert(fila);

  if (error) throw new Error(`No se pudo guardar el cliente: ${error.message}`);
  revalidar();
  if (id) revalidatePath(`/landing-pages/clients/${id}`);
}

export async function cambiarEstadoCliente(id: string, estado: string) {
  await exigirSesion();
  const status = unaDe<EstadoCliente>(estado, ESTADOS_CLIENTE, "Estado");

  const { error } = await supabaseAdmin()
    .from("clients")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  revalidar();
  revalidatePath(`/landing-pages/clients/${id}`);
}

export async function guardarCotizacion(fd: FormData) {
  await exigirSesion();

  const titulo = texto(fd, "title");
  if (!titulo) throw new Error("Falta el título de la cotización");

  const fila = {
    title: titulo,
    client_id: opcional(fd, "client_id"),
    service: opcional(fd, "service"),
    amount: monto(fd, "amount"),
    currency: unaDe<Moneda>(texto(fd, "currency"), MONEDAS, "Moneda"),
    status: unaDe<EstadoCotizacion>(
      texto(fd, "status"),
      ESTADOS_COTIZACION,
      "Estado",
    ),
    proposal_url: url(fd, "proposal_url"),
    sent_at: fecha(fd, "sent_at"),
    notes: opcional(fd, "notes"),
    updated_at: new Date().toISOString(),
  };

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("quotes").update(fila).eq("id", id)
    : await db.from("quotes").insert(fila);

  if (error)
    throw new Error(`No se pudo guardar la cotización: ${error.message}`);
  revalidar();
}

const BUCKET = "propuestas";
const BUCKET_PORTADAS = "portadas";

const IMAGENES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
];

/**
 * Sube la portada del proyecto. Este bucket es público a propósito: la imagen
 * se muestra con <img> y una URL firmada expiraría a los minutos.
 */
export async function subirPortada(fd: FormData) {
  await exigirSesion();

  const projectId = texto(fd, "project_id");
  if (!projectId) throw new Error("Falta el proyecto");

  const archivo = fd.get("portada");
  if (!(archivo instanceof File) || archivo.size === 0) {
    throw new Error("No llegó ninguna imagen");
  }
  if (!IMAGENES.includes(archivo.type)) {
    throw new Error("El archivo debe ser una imagen (PNG, JPG, WEBP o GIF)");
  }
  if (archivo.size > 5 * 1024 * 1024) {
    throw new Error("La imagen supera los 5 MB");
  }

  const db = supabaseAdmin();
  const ext = archivo.type.split("/")[1].replace("jpeg", "jpg");
  const ruta = `${projectId}/${Date.now()}.${ext}`;

  const { error: errSubida } = await db.storage
    .from(BUCKET_PORTADAS)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

  if (errSubida) throw new Error(`No se pudo subir: ${errSubida.message}`);

  // Borrar la anterior evita acumular imágenes que nadie ve pero se pagan.
  const { data: previo } = await db
    .from("projects")
    .select("cover_url")
    .eq("id", projectId)
    .maybeSingle();

  const anterior = rutaDePortada(previo?.cover_url);
  if (anterior) await db.storage.from(BUCKET_PORTADAS).remove([anterior]);

  const { data: publica } = db.storage
    .from(BUCKET_PORTADAS)
    .getPublicUrl(ruta);

  const { error } = await db
    .from("projects")
    .update({
      cover_url: publica.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidar();
  revalidatePath(`/landing-pages/projects/${projectId}`);
}

/** Extrae la ruta interna de una URL pública del bucket; null si es externa. */
function rutaDePortada(url: string | null | undefined): string | null {
  if (!url) return null;
  const marca = `/${BUCKET_PORTADAS}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : url.slice(i + marca.length);
}

export async function borrarPortada(projectId: string) {
  await exigirSesion();
  const db = supabaseAdmin();

  const { data } = await db
    .from("projects")
    .select("cover_url")
    .eq("id", projectId)
    .maybeSingle();

  const ruta = rutaDePortada(data?.cover_url);
  if (ruta) await db.storage.from(BUCKET_PORTADAS).remove([ruta]);

  const { error } = await db
    .from("projects")
    .update({ cover_url: null, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) throw new Error(`No se pudo quitar: ${error.message}`);
  revalidar();
  revalidatePath(`/landing-pages/projects/${projectId}`);
}

/** Sube el PDF de la propuesta al bucket privado y lo vincula a la cotización. */
export async function subirDocumento(fd: FormData) {
  await exigirSesion();

  const quoteId = texto(fd, "quote_id");
  if (!quoteId) throw new Error("Falta la cotización");

  const archivo = fd.get("documento");
  if (!(archivo instanceof File) || archivo.size === 0) {
    throw new Error("No llegó ningún archivo");
  }
  if (archivo.type !== "application/pdf") {
    throw new Error("El documento debe ser un PDF");
  }
  if (archivo.size > 10 * 1024 * 1024) {
    throw new Error("El PDF supera los 10 MB");
  }

  const db = supabaseAdmin();
  const ruta = `${quoteId}/${Date.now()}-${slugify(archivo.name.replace(/\.pdf$/i, ""))}.pdf`;

  const { error: errSubida } = await db.storage
    .from(BUCKET)
    .upload(ruta, archivo, { contentType: "application/pdf", upsert: false });

  if (errSubida) throw new Error(`No se pudo subir: ${errSubida.message}`);

  // Reemplazar el anterior evita dejar archivos huérfanos ocupando espacio.
  const { data: previo } = await db
    .from("quotes")
    .select("document_path")
    .eq("id", quoteId)
    .maybeSingle();

  if (previo?.document_path) {
    await db.storage.from(BUCKET).remove([previo.document_path]);
  }

  const { error } = await db
    .from("quotes")
    .update({ document_path: ruta, updated_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath("/landing-pages/quotes");
}

export async function borrarDocumento(quoteId: string) {
  await exigirSesion();
  const db = supabaseAdmin();

  const { data } = await db
    .from("quotes")
    .select("document_path")
    .eq("id", quoteId)
    .maybeSingle();

  if (data?.document_path) {
    await db.storage.from(BUCKET).remove([data.document_path]);
  }

  const { error } = await db
    .from("quotes")
    .update({ document_path: null, updated_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
  revalidatePath("/landing-pages/quotes");
}

/**
 * URL temporal para abrir el PDF. El bucket es privado: sin firma no hay
 * acceso, así que la propuesta de un cliente no queda expuesta.
 */
export async function urlDocumento(quoteId: string): Promise<string | null> {
  await exigirSesion();
  const db = supabaseAdmin();

  const { data } = await db
    .from("quotes")
    .select("document_path")
    .eq("id", quoteId)
    .maybeSingle();

  if (!data?.document_path) return null;

  const { data: firmada, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(data.document_path, 60 * 10);

  if (error) throw new Error(`No se pudo abrir: ${error.message}`);
  return firmada?.signedUrl ?? null;
}

export async function cambiarEstadoCotizacion(id: string, estado: string) {
  await exigirSesion();
  const status = unaDe<EstadoCotizacion>(estado, ESTADOS_COTIZACION, "Estado");

  const { error } = await supabaseAdmin()
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  revalidar();
}

/**
 * Duplica el proyecto con su checklist de tareas y sus recursos: eso es lo que
 * se reusa entre proyectos parecidos. No copia el avance — las tareas nacen
 * pendientes y sin fecha, porque son de un trabajo nuevo.
 */
export async function duplicarProyecto(id: string) {
  await exigirSesion();
  const db = supabaseAdmin();

  const { data: original, error: errLeer } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (errLeer || !original)
    throw new Error(`No se pudo leer el proyecto: ${errLeer?.message ?? "no existe"}`);

  const { data: copia, error: errCrear } = await db
    .from("projects")
    .insert({
      name: `${original.name} (copia)`,
      client_name: original.client_name,
      client_id: original.client_id,
      kind: original.kind,
      status: "por-iniciar",
      stage: null,
      responsible_user_id: original.responsible_user_id,
      due_date: null,
      priority: original.priority,
      notes: original.notes,
      notes_important: original.notes_important,
      cover_url: original.cover_url,
    })
    .select("id")
    .single();

  if (errCrear || !copia)
    throw new Error(`No se pudo duplicar: ${errCrear?.message ?? "sin id"}`);

  const [{ data: tareas }, { data: recursos }] = await Promise.all([
    db.from("tasks").select("*").eq("project_id", id).order("position"),
    db.from("project_resources").select("*").eq("project_id", id),
  ]);

  if (tareas?.length) {
    await db.from("tasks").insert(
      tareas.map((t, i) => ({
        project_id: copia.id,
        title: t.title,
        description: t.description,
        status: "pendiente",
        assigned_to: t.assigned_to,
        priority: t.priority,
        due_date: null,
        position: i,
      })),
    );
  }

  if (recursos?.length) {
    await db.from("project_resources").insert(
      recursos.map((r) => ({
        project_id: copia.id,
        name: r.name,
        kind: r.kind,
        url: r.url,
        notes: r.notes,
      })),
    );
  }

  revalidar();
  redirect(`/landing-pages/projects/${copia.id}`);
}

/** Borra el proyecto. Sus tareas caen por cascade; los recursos también. */
export async function borrarProyecto(id: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin().from("projects").delete().eq("id", id);

  if (error) throw new Error(`No se pudo borrar el proyecto: ${error.message}`);
  revalidar();
}

/**
 * Guarda una respuesta del formulario de tarea. Valida contra la plantilla:
 * un id de campo que no exista ahí se rechaza.
 */
/** Guarda una tarea del SOP: título, plantilla de formulario y pasos. */
export async function guardarTareaProceso(fd: FormData) {
  await exigirSesion();

  const processId = texto(fd, "process_id");
  if (!processId) throw new Error("Falta el proceso");

  const titulo = texto(fd, "title");
  if (!titulo) throw new Error("Falta el título");

  // Una línea por paso; la indentación marca sub-items.
  const pasos: Paso[] = [];
  for (const linea of texto(fd, "steps").split("\n")) {
    const t = linea.trim();
    if (!t) continue;
    const anidado = /^[\s\-*]{2,}|^\t/.test(linea) || /^ {2,}/.test(linea);
    if (anidado && pasos.length > 0) {
      const padre = pasos[pasos.length - 1];
      padre.hijos = [...(padre.hijos ?? []), t.replace(/^[-*]\s*/, "")];
    } else {
      pasos.push({ texto: t.replace(/^[-*]\s*/, "") });
    }
  }

  const fila = {
    process_id: processId,
    title: titulo,
    template: opcional(fd, "template"),
    steps: pasos,
    notes: opcional(fd, "notes"),
    updated_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  const id = opcional(fd, "id");

  if (id) {
    const { error } = await db.from("process_tasks").update(fila).eq("id", id);
    if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  } else {
    const { count } = await db
      .from("process_tasks")
      .select("id", { count: "exact", head: true })
      .eq("process_id", processId);

    const { error } = await db
      .from("process_tasks")
      .insert({ ...fila, position: count ?? 0 });
    if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  }

  revalidatePath("/landing-pages/tasks");
}

export async function borrarTareaProceso(id: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin()
    .from("process_tasks")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
  revalidatePath("/landing-pages/tasks");
}

/** Reordena las tareas del SOP: define en qué orden nacen en el proyecto. */
export async function ordenarTareasProceso(idsEnOrden: string[]) {
  await exigirSesion();
  const db = supabaseAdmin();

  await Promise.all(
    idsEnOrden.map((id, i) =>
      db.from("process_tasks").update({ position: i }).eq("id", id),
    ),
  );

  revalidatePath("/landing-pages/tasks");
}

export async function guardarProceso(fd: FormData) {
  await exigirSesion();

  const nombre = texto(fd, "name");
  if (!nombre) throw new Error("Falta el nombre del proceso");

  const slug = texto(fd, "slug") || nombre.toLowerCase().replace(/\s+/g, "-");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("El identificador solo admite minúsculas, números y guiones");
  }

  const fila = {
    slug,
    name: nombre,
    description: opcional(fd, "description"),
    updated_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  const id = opcional(fd, "id");
  const { error } = id
    ? await db.from("processes").update(fila).eq("id", id)
    : await db.from("processes").insert(fila);

  if (error) throw new Error(`No se pudo guardar el proceso: ${error.message}`);
  revalidatePath("/landing-pages/tasks");
}

export async function guardarCampoTarea(
  taskId: string,
  campoId: string,
  valor: string | string[] | null,
) {
  await exigirSesion();
  const db = supabaseAdmin();

  const { data: tarea, error: errLeer } = await db
    .from("tasks")
    .select("template, content, project_id, steps")
    .eq("id", taskId)
    .maybeSingle();

  if (errLeer || !tarea)
    throw new Error(`No se pudo leer la tarea: ${errLeer?.message ?? "no existe"}`);

  const plantilla = plantillaDe(tarea.template);
  const pasosSop: Paso[] = tarea.steps ?? [];

  // El checklist del SOP no vive en la plantilla: se valida contra los pasos
  // que la tarea copió al crearse.
  const campo =
    campoId === "pasos" && pasosSop.length > 0
      ? { id: "pasos", label: "", tipo: "checklist" as const, items: pasosSop }
      : plantilla?.secciones
          .flatMap((s) => s.campos)
          .find((c) => c.id === campoId);

  if (!campo) throw new Error("Campo desconocido");

  // Una opción fuera de las declaradas es dato corrupto, no un valor válido.
  if (campo.tipo === "opciones" || campo.tipo === "checklist") {
    // Los sub-items anidados también son valores válidos.
    const permitidos = campo.items
      ? campo.items.flatMap((i) => [i.texto, ...(i.hijos ?? [])])
      : (campo.opciones ?? []);

    if (permitidos.length > 0) {
      const valores = Array.isArray(valor) ? valor : valor ? [valor] : [];
      if (valores.some((v) => !permitidos.includes(v))) {
        throw new Error("Opción inválida");
      }
    }
  }

  const contenido = { ...(tarea.content ?? {}), [campoId]: valor };

  const { error } = await db
    .from("tasks")
    .update({ content: contenido, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath(`/landing-pages/tasks/${taskId}`);
  if (tarea.project_id)
    revalidatePath(`/landing-pages/projects/${tarea.project_id}`);
}

export async function borrarTarea(id: string, projectId?: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin().from("tasks").delete().eq("id", id);

  if (error) throw new Error(`No se pudo borrar la tarea: ${error.message}`);
  revalidar();
  if (projectId) revalidatePath(`/landing-pages/projects/${projectId}`);
}

/**
 * Borra el cliente. Sus proyectos y cotizaciones quedan sin vincular
 * (on delete set null), no se borran.
 */
export async function borrarCliente(id: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin().from("clients").delete().eq("id", id);

  if (error) throw new Error(`No se pudo borrar el cliente: ${error.message}`);
  revalidar();
}

export async function borrarCotizacion(id: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin().from("quotes").delete().eq("id", id);

  if (error) throw new Error(`No se pudo borrar la cotización: ${error.message}`);
  revalidar();
}

export async function guardarAjuste(clave: string, valor: string) {
  await exigirSesion();

  const limpio = valor.trim();
  // Validar acá también: el valor viaja como link clickeable después.
  if (limpio && !/^https?:\/\//i.test(limpio)) {
    throw new Error("El link debe empezar con http:// o https://");
  }

  const { error } = await supabaseAdmin()
    .from("settings")
    .upsert({
      key: clave,
      value: limpio || null,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath("/landing-pages/quotes");
}

/**
 * Registra el cobro de una cotización aprobada en finanzas/movimientos.json.
 * Finanzas es transversal a las unidades: se escribe ahí, no se duplica acá.
 */
export async function registrarCobro(fd: FormData) {
  await exigirSesion();

  const quoteId = texto(fd, "quote_id");
  if (!quoteId) throw new Error("Falta la cotización");

  const fecha_ = fecha(fd, "fecha") ?? hoyISO();

  const moneda = texto(fd, "moneda");
  // El JSON de finanzas solo maneja ARS y USD.
  if (moneda !== "ARS" && moneda !== "USD") {
    throw new Error("Finanzas solo admite ARS o USD");
  }

  const montoNum = monto(fd, "monto");
  if (montoNum === null || montoNum <= 0) throw new Error("Monto inválido");

  const concepto = texto(fd, "concepto");
  if (!concepto) throw new Error("Falta el concepto");

  const estado = texto(fd, "estado");
  if (!["pagado", "pendiente", "cobrado"].includes(estado)) {
    throw new Error("Estado inválido");
  }

  const id = `${fecha_}-${slugify(concepto)}-${Date.now().toString(36)}`;

  const { error: errMov } = await supabaseAdmin().from("movements").insert({
    id,
    fecha: fecha_,
    ambito: "negocio",
    tipo: "ingreso",
    monto: montoNum,
    moneda,
    categoria: "servicio",
    concepto,
    unidad: "landing-pages",
    cliente: opcional(fd, "cliente"),
    estado,
  });

  if (errMov) throw new Error(`No se pudo registrar: ${errMov.message}`);

  // Guardar el vínculo evita registrar dos veces el mismo cobro.
  await supabaseAdmin()
    .from("quotes")
    .update({ movement_id: id, updated_at: new Date().toISOString() })
    .eq("id", quoteId);

  revalidatePath("/landing-pages/quotes");
  revalidatePath("/finanzas/negocio");
}

export async function cambiarEtapaProyecto(id: string, etapa: string) {
  await exigirSesion();
  const stage = etapa === "" ? null : unaDe<Etapa>(etapa, ETAPAS, "Etapa");

  const { error } = await supabaseAdmin()
    .from("projects")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`No se pudo cambiar la etapa: ${error.message}`);
  revalidar();
  revalidatePath(`/landing-pages/projects/${id}`);
}

export async function guardarAnotaciones(projectId: string, contenido: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin()
    .from("projects")
    .update({
      notes_important: contenido.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error)
    throw new Error(`No se pudieron guardar las anotaciones: ${error.message}`);
  revalidatePath(`/landing-pages/projects/${projectId}`);
}

export async function guardarRecurso(fd: FormData) {
  await exigirSesion();

  const projectId = texto(fd, "project_id");
  if (!projectId) throw new Error("Falta el proyecto");

  const nombre = texto(fd, "name");
  if (!nombre) throw new Error("Falta el nombre del recurso");

  const fila: Record<string, unknown> = {
    project_id: projectId,
    name: nombre,
    kind: unaDe<TipoRecurso>(texto(fd, "kind"), TIPOS_RECURSO, "Tipo"),
    url: url(fd, "url"),
    username: opcional(fd, "username"),
    notes: opcional(fd, "notes"),
    updated_at: new Date().toISOString(),
  };

  // El campo llega vacío cuando no se tocó: en ese caso se conserva la
  // credencial guardada en vez de borrarla.
  const secreto = String(fd.get("secret") ?? "");
  if (fd.get("borrar_secreto")) {
    fila.secret_encrypted = null;
  } else if (secreto !== "") {
    fila.secret_encrypted = cifrar(secreto);
  }

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("project_resources").update(fila).eq("id", id)
    : await db.from("project_resources").insert(fila);

  if (error) throw new Error(`No se pudo guardar el recurso: ${error.message}`);
  revalidatePath(`/landing-pages/projects/${projectId}`);
}

/**
 * Devuelve la credencial descifrada. Se llama solo cuando el usuario la pide:
 * así no viaja al cliente en cada render de la página.
 */
export async function revelarCredencial(
  id: string,
  tabla: "project" | "client" = "project",
): Promise<string | null> {
  await exigirSesion();

  const { data, error } = await supabaseAdmin()
    .from(tabla === "client" ? "client_resources" : "project_resources")
    .select("secret_encrypted")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer: ${error.message}`);
  if (!data?.secret_encrypted) return null;

  return descifrar(data.secret_encrypted);
}

export async function guardarNotaCliente(fd: FormData) {
  await exigirSesion();

  const clientId = texto(fd, "client_id");
  if (!clientId) throw new Error("Falta el cliente");

  const titulo = texto(fd, "title");
  if (!titulo) throw new Error("Falta el título");

  const fila = {
    client_id: clientId,
    title: titulo,
    url: url(fd, "url"),
    body: opcional(fd, "body"),
    meeting_date: fecha(fd, "meeting_date"),
    updated_at: new Date().toISOString(),
  };

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("client_notes").update(fila).eq("id", id)
    : await db.from("client_notes").insert(fila);

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath(`/landing-pages/clients/${clientId}`);
}

export async function borrarNotaCliente(id: string, clientId: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin()
    .from("client_notes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
  revalidatePath(`/landing-pages/clients/${clientId}`);
}

export async function guardarRecursoCliente(fd: FormData) {
  await exigirSesion();

  const clientId = texto(fd, "client_id");
  if (!clientId) throw new Error("Falta el cliente");

  const nombre = texto(fd, "name");
  if (!nombre) throw new Error("Falta el nombre del recurso");

  const fila: Record<string, unknown> = {
    client_id: clientId,
    name: nombre,
    kind: unaDe<TipoRecurso>(texto(fd, "kind"), TIPOS_RECURSO, "Tipo"),
    url: url(fd, "url"),
    username: opcional(fd, "username"),
    notes: opcional(fd, "notes"),
    updated_at: new Date().toISOString(),
  };

  const secreto = String(fd.get("secret") ?? "");
  if (fd.get("borrar_secreto")) {
    fila.secret_encrypted = null;
  } else if (secreto !== "") {
    fila.secret_encrypted = cifrar(secreto);
  }

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("client_resources").update(fila).eq("id", id)
    : await db.from("client_resources").insert(fila);

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath(`/landing-pages/clients/${clientId}`);
}

export async function borrarRecursoCliente(id: string, clientId: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin()
    .from("client_resources")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
  revalidatePath(`/landing-pages/clients/${clientId}`);
}

export async function borrarRecurso(id: string, projectId: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin()
    .from("project_resources")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`No se pudo borrar el recurso: ${error.message}`);
  revalidatePath(`/landing-pages/projects/${projectId}`);
}

/**
 * Reordena el kanban. Recibe el orden final de una columna y lo persiste;
 * sin esto las tarjetas saltan de lugar al recargar.
 */
export async function moverTarea(
  id: string,
  estado: string,
  idsEnOrden: string[],
  projectId: string,
) {
  await exigirSesion();
  const status = unaDe<EstadoTarea>(estado, ESTADOS_TAREA, "Estado");

  const db = supabaseAdmin();
  const ahora = new Date().toISOString();

  const { error } = await db
    .from("tasks")
    .update({ status, updated_at: ahora })
    .eq("id", id);

  if (error) throw new Error(`No se pudo mover la tarea: ${error.message}`);

  await Promise.all(
    idsEnOrden.map((taskId, i) =>
      db.from("tasks").update({ position: i }).eq("id", taskId),
    ),
  );

  revalidar();
  revalidatePath(`/landing-pages/projects/${projectId}`);
}
