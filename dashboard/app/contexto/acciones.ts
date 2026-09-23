"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarFrontmatter,
  reemplazarSeccion,
  anteponerEnSeccion,
  crearArchivoContexto,
  slugify,
} from "@/lib/escritura";

const ESTADOS_PROYECTO = [
  "activo",
  "por-empezar",
  "bloqueado",
  "pausado",
  "terminado",
];
const ESTADOS_CLIENTE = ["activo", "stand-by", "inactivo", "prospecto"];
const PRIORIDADES = ["alta", "media", "baja"];

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

/**
 * Edita los campos operativos de un proyecto. Solo toca:
 * - frontmatter: estado, prioridad, entrega
 * - secciones de párrafo: Próximo paso, Estado actual
 * NUNCA toca bitácora, decisiones ni notas (texto libre escrito a mano).
 * Si hay una nota de bitácora nueva, se ANTEPONE, no se pisa.
 */
export async function editarProyecto(fd: FormData) {
  const archivo = texto(fd, "archivo");
  if (!archivo.endsWith(".md")) throw new Error("Archivo inválido");

  const estado = texto(fd, "estado");
  if (estado && !ESTADOS_PROYECTO.includes(estado)) {
    throw new Error("Estado inválido");
  }
  const prioridad = texto(fd, "prioridad");
  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    throw new Error("Prioridad inválida");
  }
  const entrega = texto(fd, "entrega");
  if (entrega && !/^\d{4}-\d{2}-\d{2}$/.test(entrega)) {
    throw new Error("Fecha de entrega inválida");
  }

  actualizarFrontmatter(archivo, {
    estado: estado || undefined,
    prioridad: prioridad || undefined,
    entrega: entrega || undefined,
  });

  const proximoPaso = texto(fd, "proximoPaso");
  if (proximoPaso) reemplazarSeccion(archivo, "Próximo paso", proximoPaso);

  const estadoActual = texto(fd, "estadoActual");
  if (estadoActual) reemplazarSeccion(archivo, "Estado actual", estadoActual);

  const bitacora = texto(fd, "bitacora");
  if (bitacora) anteponerEnSeccion(archivo, "Bitácora", bitacora);

  const slug = texto(fd, "slug");
  revalidatePath(`/proyecto/${slug}`);
  revalidatePath("/");
}

/** Cambia solo el estado de un cliente. */
export async function cambiarEstadoCliente(
  archivo: string,
  estado: string,
  slug: string,
  unidad: string,
) {
  if (!archivo.endsWith(".md")) throw new Error("Archivo inválido");
  if (!ESTADOS_CLIENTE.includes(estado)) throw new Error("Estado inválido");

  actualizarFrontmatter(archivo, { estado });
  revalidatePath(`/unidad/${unidad}`);
}

/** Crea un proyecto nuevo desde la plantilla. */
export async function crearProyecto(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const unidad = texto(fd, "unidad");
  const cliente = texto(fd, "cliente");
  if (!nombre) throw new Error("Falta el nombre");
  if (!unidad) throw new Error("Falta la unidad");

  const slug = slugify(nombre);
  const archivo = `${unidad}/proyectos/${slug}.md`;
  const entrega = texto(fd, "entrega");

  const contenido = `---
tipo: proyecto
nombre: ${nombre}
unidad: ${unidad}
cliente: ${cliente || ""}
estado: por-empezar
prioridad: media
responsables: []
${entrega ? `entrega: ${entrega}\n` : ""}actualizado: ${new Date().toISOString().slice(0, 10)}
---

# ${nombre}${cliente ? ` — ${cliente}` : ""}

## Próximo paso
${texto(fd, "proximoPaso") || ""}

## Bloqueos

## Estado actual
Sin comenzar.

## Recursos
| Qué | Dónde |
| --- | --- |
| Repositorio | |
| Carpeta local | |
| Drive | |

## Decisiones

## Bitácora

## Notas
`;

  crearArchivoContexto(archivo, contenido);
  revalidatePath(`/unidad/${unidad}`);
  revalidatePath("/");
}

/** Crea un cliente nuevo desde la plantilla. */
export async function crearCliente(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const unidad = texto(fd, "unidad");
  if (!nombre) throw new Error("Falta el nombre");
  if (!unidad) throw new Error("Falta la unidad");

  const slug = slugify(nombre);
  const archivo = `${unidad}/clientes/${slug}.md`;

  const contenido = `---
tipo: cliente
nombre: ${nombre}
unidad: ${unidad}
estado: activo
contacto:
canal:
actualizado: ${new Date().toISOString().slice(0, 10)}
---

# ${nombre}

## Contexto
${texto(fd, "contexto") || ""}

## Proyectos

## Esperando respuesta

## Recursos
| Qué | Dónde |
| --- | --- |
| Drive | |

## Notas
`;

  crearArchivoContexto(archivo, contenido);
  revalidatePath(`/unidad/${unidad}`);
}
