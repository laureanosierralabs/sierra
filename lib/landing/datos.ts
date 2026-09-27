import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type {
  Cliente,
  Cotizacion,
  Moneda,
  NotaCliente,
  PagoCotizacion,
  Proceso,
  Proyecto,
  Recurso,
  Tarea,
  TareaProceso,
} from "@/lib/landing/tipos";

/** Aplana el join anidado de Supabase a un array simple de ids. */
function conAsignados(
  fila: Omit<Proyecto, "assignee_ids"> & {
    project_assignees?: { user_id: string }[] | null;
  },
): Proyecto {
  const { project_assignees, ...resto } = fila;
  return { ...resto, assignee_ids: (project_assignees ?? []).map((a) => a.user_id) };
}

function conAsignadosTarea(
  fila: Omit<Tarea, "assignee_ids"> & {
    task_assignees?: { user_id: string }[] | null;
  },
): Tarea {
  const { task_assignees, ...resto } = fila;
  return { ...resto, assignee_ids: (task_assignees ?? []).map((a) => a.user_id) };
}

/**
 * Ordena por urgencia real, no por fecha calendario pura: lo más cercano a
 * hoy va primero (venza pronto o haya vencido hace poco), y lo sin fecha
 * queda al final. Un "due_date asc" simple pondría un deadline ya vencido
 * hace un año antes que uno que vence mañana, que es al revés de lo útil.
 */
function porUrgencia<T extends { due_date: string | null }>(filas: T[]): T[] {
  const hoy = Date.now();
  const distancia = (f: T) =>
    f.due_date === null
      ? Infinity
      : Math.abs(new Date(`${f.due_date}T00:00:00`).getTime() - hoy);

  return [...filas].sort((a, b) => distancia(a) - distancia(b));
}

export async function listarProyectos(): Promise<Proyecto[]> {
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("*, project_assignees(user_id)");

  if (error) throw new Error(`No se pudieron leer los proyectos: ${error.message}`);
  return porUrgencia((data ?? []).map(conAsignados));
}

export async function listarTareas(): Promise<Tarea[]> {
  const { data, error } = await supabaseAdmin()
    .from("tasks")
    .select("*, task_assignees(user_id)")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`No se pudieron leer las tareas: ${error.message}`);
  return (data ?? []).map(conAsignadosTarea);
}

export async function obtenerProyecto(id: string): Promise<Proyecto | null> {
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("*, project_assignees(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el proyecto: ${error.message}`);
  return data ? conAsignados(data) : null;
}

/** Tareas del proyecto en orden de kanban. */
export async function listarTareasDeProyecto(
  projectId: string,
): Promise<Tarea[]> {
  const { data, error } = await supabaseAdmin()
    .from("tasks")
    .select("*, task_assignees(user_id)")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron leer las tareas: ${error.message}`);
  return (data ?? []).map(conAsignadosTarea);
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
    .select("*, task_assignees(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la tarea: ${error.message}`);
  return data ? conAsignadosTarea(data) : null;
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

/** Aplana el join de la tabla puente a un array de ids. */
function conProyectos(
  fila: Omit<Cotizacion, "project_ids"> & {
    quote_projects?: { project_id: string }[] | null;
  },
): Cotizacion {
  const { quote_projects, ...resto } = fila;
  return {
    ...resto,
    project_ids: (quote_projects ?? []).map((q) => q.project_id),
  };
}

export async function listarCotizaciones(): Promise<Cotizacion[]> {
  const { data, error } = await supabaseAdmin()
    .from("quotes")
    .select("*, quote_projects(project_id)")
    .order("numero", { ascending: false });

  if (error)
    throw new Error(`No se pudieron leer las cotizaciones: ${error.message}`);
  return (data ?? []).map(conProyectos);
}

export async function obtenerCotizacion(id: string): Promise<Cotizacion | null> {
  const { data, error } = await supabaseAdmin()
    .from("quotes")
    .select("*, quote_projects(project_id)")
    .eq("id", id)
    .maybeSingle();

  if (error)
    throw new Error(`No se pudo leer la cotización: ${error.message}`);
  return data ? conProyectos(data) : null;
}

/** Cobros de una cotización, del más reciente al más viejo. */
export async function listarPagos(quoteId: string): Promise<PagoCotizacion[]> {
  const { data, error } = await supabaseAdmin()
    .from("quote_payments")
    .select("*")
    .eq("quote_id", quoteId)
    .order("paid_on", { ascending: false });

  if (error) throw new Error(`No se pudieron leer los cobros: ${error.message}`);
  return data ?? [];
}

/** Lo cotizado por proyecto, para el indicador de la lista. Un proyecto
    cubierto por varias cotizaciones acumula el total de todas. */
export interface ResumenCotizado {
  total: number;
  currency: Moneda;
  cantidad: number;
}

export async function cotizadoPorProyecto(): Promise<
  Map<string, ResumenCotizado>
> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("quote_projects")
    .select("project_id, quotes(total_amount, currency)");

  if (error)
    throw new Error(`No se pudo leer lo cotizado: ${error.message}`);

  const mapa = new Map<string, ResumenCotizado>();
  for (const fila of data ?? []) {
    const q = fila.quotes as unknown as {
      total_amount: number | null;
      currency: Moneda;
    } | null;
    if (!q) continue;

    const previo = mapa.get(fila.project_id);
    mapa.set(fila.project_id, {
      total: (previo?.total ?? 0) + (q.total_amount ?? 0),
      currency: q.currency,
      cantidad: (previo?.cantidad ?? 0) + 1,
    });
  }
  return mapa;
}

/** Las cotizaciones que cubren un proyecto. Puede tener más de una. */
export async function listarCotizacionesDeProyecto(
  projectId: string,
): Promise<Cotizacion[]> {
  const db = supabaseAdmin();
  const { data: vinculos, error } = await db
    .from("quote_projects")
    .select("quote_id")
    .eq("project_id", projectId);

  if (error)
    throw new Error(`No se pudieron leer las cotizaciones: ${error.message}`);

  const ids = (vinculos ?? []).map((v) => v.quote_id);
  if (ids.length === 0) return [];

  const { data, error: errQuotes } = await db
    .from("quotes")
    .select("*, quote_projects(project_id)")
    .in("id", ids)
    .order("numero", { ascending: false });

  if (errQuotes)
    throw new Error(`No se pudieron leer las cotizaciones: ${errQuotes.message}`);
  return (data ?? []).map(conProyectos);
}
