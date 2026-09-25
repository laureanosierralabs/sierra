import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type {
  Cliente,
  Cotizacion,
  NotaCliente,
  Proceso,
  Proyecto,
  Recurso,
  Tarea,
  TareaProceso,
} from "@/lib/landing/tipos";

export async function listarProyectos(): Promise<Proyecto[]> {
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`No se pudieron leer los proyectos: ${error.message}`);
  return data ?? [];
}

export async function listarTareas(): Promise<Tarea[]> {
  const { data, error } = await supabaseAdmin()
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`No se pudieron leer las tareas: ${error.message}`);
  return data ?? [];
}

export async function obtenerProyecto(id: string): Promise<Proyecto | null> {
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el proyecto: ${error.message}`);
  return data;
}

/** Tareas del proyecto en orden de kanban. */
export async function listarTareasDeProyecto(
  projectId: string,
): Promise<Tarea[]> {
  const { data, error } = await supabaseAdmin()
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron leer las tareas: ${error.message}`);
  return data ?? [];
}

export type RecursoVista = Omit<Recurso, "secret_encrypted"> & {
  /** Si tiene credencial guardada, sin exponerla. */
  tieneSecreto: boolean;
};

/**
 * El texto cifrado no viaja al cliente: solo si hay credencial o no. Para
 * verla hay que pedirla explícitamente con revelarCredencial().
 */
export async function listarRecursos(
  projectId: string,
): Promise<RecursoVista[]> {
  const { data, error } = await supabaseAdmin()
    .from("project_resources")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los recursos: ${error.message}`);

  return (data ?? []).map(({ secret_encrypted, ...resto }) => ({
    ...resto,
    tieneSecreto: Boolean(secret_encrypted),
  }));
}

export async function obtenerAjuste(clave: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from("settings")
    .select("value")
    .eq("key", clave)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el ajuste: ${error.message}`);
  return data?.value ?? null;
}

export async function listarProcesos(): Promise<Proceso[]> {
  const { data, error } = await supabaseAdmin()
    .from("processes")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los procesos: ${error.message}`);
  return data ?? [];
}

export async function listarTareasDeProceso(
  processId: string,
): Promise<TareaProceso[]> {
  const { data, error } = await supabaseAdmin()
    .from("process_tasks")
    .select("*")
    .eq("process_id", processId)
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron leer las tareas: ${error.message}`);
  return data ?? [];
}

export async function obtenerTarea(id: string): Promise<Tarea | null> {
  const { data, error } = await supabaseAdmin()
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la tarea: ${error.message}`);
  return data;
}

export async function listarNotasCliente(
  clientId: string,
): Promise<NotaCliente[]> {
  const { data, error } = await supabaseAdmin()
    .from("client_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("meeting_date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`No se pudieron leer las notas: ${error.message}`);
  return data ?? [];
}

/** Igual que listarRecursos pero de un cliente. */
export async function listarRecursosCliente(
  clientId: string,
): Promise<RecursoVista[]> {
  const { data, error } = await supabaseAdmin()
    .from("client_resources")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los accesos: ${error.message}`);

  return (data ?? []).map(({ secret_encrypted, ...resto }) => ({
    ...resto,
    project_id: "",
    tieneSecreto: Boolean(secret_encrypted),
  }));
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabaseAdmin()
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los clientes: ${error.message}`);
  return data ?? [];
}

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await supabaseAdmin()
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el cliente: ${error.message}`);
  return data;
}

export async function listarCotizaciones(): Promise<Cotizacion[]> {
  const { data, error } = await supabaseAdmin()
    .from("quotes")
    .select("*")
    .order("sent_at", { ascending: false, nullsFirst: false });

  if (error)
    throw new Error(`No se pudieron leer las cotizaciones: ${error.message}`);
  return data ?? [];
}
