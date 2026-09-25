import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { Cliente, Proyecto, Recurso, Unidad } from "./types";

/**
 * Contexto operativo. Vive en Supabase, no en el filesystem: en Vercel el
 * disco es de solo lectura y efímero.
 */

interface FilaUnidad {
  slug: string;
  nombre: string;
  estado: string | null;
  que_es: string | null;
  como_se_opera: string | null;
  recursos: Recurso[];
}

interface FilaProyecto {
  slug: string;
  unidad: string;
  nombre: string;
  cliente: string | null;
  estado: string;
  prioridad: string;
  responsables: string[];
  entrega: string | null;
  actualizado: string | null;
  proximo_paso: string | null;
  bloqueos: string[];
  estado_actual: string | null;
  recursos: Recurso[];
  decisiones: string[];
  bitacora: string[];
  notas: string | null;
}

interface FilaCliente {
  slug: string;
  unidad: string;
  nombre: string;
  estado: string | null;
  canal: string | null;
  contexto: string | null;
  esperando_respuesta: string[];
  recursos: Recurso[];
}

function aProyecto(f: FilaProyecto): Proyecto {
  return {
    slug: f.slug,
    archivo: `${f.unidad}/proyectos/${f.slug}.md`,
    nombre: f.nombre,
    unidad: f.unidad,
    cliente: f.cliente ?? "",
    estado: f.estado as Proyecto["estado"],
    prioridad: f.prioridad as Proyecto["prioridad"],
    responsables: f.responsables ?? [],
    entrega: f.entrega ?? undefined,
    actualizado: f.actualizado ?? undefined,
    proximoPaso: f.proximo_paso ?? undefined,
    bloqueos: f.bloqueos ?? [],
    estadoActual: f.estado_actual ?? undefined,
    recursos: f.recursos ?? [],
    decisiones: f.decisiones ?? [],
    bitacora: f.bitacora ?? [],
    notas: f.notas ?? undefined,
  };
}

function aCliente(f: FilaCliente): Cliente {
  return {
    slug: f.slug,
    archivo: `${f.unidad}/clientes/${f.slug}.md`,
    nombre: f.nombre,
    unidad: f.unidad,
    estado: f.estado ?? "activo",
    canal: f.canal ?? undefined,
    contexto: f.contexto ?? undefined,
    esperandoRespuesta: f.esperando_respuesta ?? [],
    recursos: f.recursos ?? [],
  };
}

export async function getUnidades(): Promise<Unidad[]> {
  const db = supabaseAdmin();

  const [unidades, proyectos, clientes] = await Promise.all([
    db.from("context_units").select("*").order("nombre"),
    db.from("context_projects").select("*").order("nombre"),
    db.from("context_clients").select("*").order("nombre"),
  ]);

  if (unidades.error) {
    throw new Error(`No se pudo leer el contexto: ${unidades.error.message}`);
  }

  const ps = (proyectos.data ?? []) as FilaProyecto[];
  const cs = (clientes.data ?? []) as FilaCliente[];

  return ((unidades.data ?? []) as FilaUnidad[]).map((u) => ({
    slug: u.slug,
    nombre: u.nombre,
    estado: u.estado ?? "activo",
    queEs: u.que_es ?? undefined,
    comoSeOpera: u.como_se_opera ?? undefined,
    recursos: u.recursos ?? [],
    proyectos: ps.filter((p) => p.unidad === u.slug).map(aProyecto),
    clientes: cs.filter((c) => c.unidad === u.slug).map(aCliente),
  }));
}

export async function getUnidad(slug: string): Promise<Unidad | null> {
  const unidades = await getUnidades();
  return unidades.find((u) => u.slug === slug) ?? null;
}

export async function getProyecto(slug: string): Promise<Proyecto | null> {
  const { data, error } = await supabaseAdmin()
    .from("context_projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el proyecto: ${error.message}`);
  return data ? aProyecto(data as FilaProyecto) : null;
}
