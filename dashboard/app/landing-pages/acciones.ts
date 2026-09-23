"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/landing/supabase";
import {
  ESTADOS_CLIENTE,
  ESTADOS_COTIZACION,
  ESTADOS_PROYECTO,
  ESTADOS_TAREA,
  ETAPAS,
  MONEDAS,
  PRIORIDADES,
  TIPOS_RECURSO,
  type EstadoCliente,
  type EstadoCotizacion,
  type EstadoProyecto,
  type EstadoTarea,
  type Etapa,
  type Moneda,
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
    responsible_user_id: opcional(fd, "responsible_user_id"),
    due_date: fecha(fd, "due_date"),
    priority: unaDe<PrioridadLanding>(texto(fd, "priority"), PRIORIDADES, "Prioridad"),
    notes: opcional(fd, "notes"),
    updated_at: new Date().toISOString(),
  };

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("projects").update(fila).eq("id", id)
    : await db.from("projects").insert(fila);

  if (error) throw new Error(`No se pudo guardar el proyecto: ${error.message}`);
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

/** Borra el proyecto. Sus tareas caen por cascade; los recursos también. */
export async function borrarProyecto(id: string) {
  await exigirSesion();

  const { error } = await supabaseAdmin().from("projects").delete().eq("id", id);

  if (error) throw new Error(`No se pudo borrar el proyecto: ${error.message}`);
  revalidar();
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

  const fila = {
    project_id: projectId,
    name: nombre,
    kind: unaDe<TipoRecurso>(texto(fd, "kind"), TIPOS_RECURSO, "Tipo"),
    url: url(fd, "url"),
    notes: opcional(fd, "notes"),
    updated_at: new Date().toISOString(),
  };

  const id = opcional(fd, "id");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("project_resources").update(fila).eq("id", id)
    : await db.from("project_resources").insert(fila);

  if (error) throw new Error(`No se pudo guardar el recurso: ${error.message}`);
  revalidatePath(`/landing-pages/projects/${projectId}`);
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
