"use server";

import { revalidatePath } from "next/cache";
import { nombreDe, usuarioActual } from "@/lib/landing/auth";
import { linksDeTexto } from "@/lib/lanzamientos/grupos";
import { agregarGrupos, borrarGrupo, gruposDeLanzamiento, marcarGrupo } from "@/lib/lanzamientos/grupos-datos";
import { contextoPortal, type ContextoPortal } from "@/lib/portal/contexto";

/**
 * Grupos de WhatsApp desde el portal: el cliente carga los suyos sin pasar por
 * el owner. El cliente sale SIEMPRE del contexto del portal (su organización),
 * nunca del formulario, y cada cambio filtra por él. La vista interna del owner
 * es de solo lectura: él los carga desde el panel.
 */
type Resultado = { error: string } | { aviso: string };

async function quienCarga(slug: string): Promise<{ ctx: ContextoPortal; nombre: string } | { error: string }> {
  const ctx = await contextoPortal(slug);
  if (!ctx) return { error: "No encontrado" };
  if (ctx.vistaInterna) return { error: "Estás en la vista interna del portal: cargá los grupos desde el panel" };
  const usuario = await usuarioActual();
  if (!usuario) return { error: "No autorizado" };
  return { ctx, nombre: nombreDe(usuario) };
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

function revalidar(slug: string, launchId: string) {
  revalidatePath(`/portal/${slug}/lanzamientos/${launchId}`);
  revalidatePath(`/landing-pages/launches/${launchId}`);
}

export async function agregarGruposPortal(fd: FormData): Promise<Resultado> {
  const quien = await quienCarga(texto(fd, "slug"));
  if ("error" in quien) return quien;
  const launchId = texto(fd, "launch_id");
  // El lanzamiento tiene que ser de este cliente.
  if (!(await gruposDeLanzamiento(quien.ctx.clientId, launchId))) return { error: "El lanzamiento no existe" };

  const { links, invalidos } = linksDeTexto(texto(fd, "links"));
  if (invalidos.length > 0) return { error: `No es un link de grupo de WhatsApp: ${invalidos[0]}` };
  const r = await agregarGrupos(quien.ctx.clientId, launchId, links, quien.nombre);
  if ("error" in r) return r;

  revalidar(quien.ctx.slug, launchId);
  return {
    aviso:
      r.agregados === 0
        ? "Esos grupos ya estaban cargados"
        : `${r.agregados === 1 ? "Grupo agregado" : `${r.agregados} grupos agregados`}${r.repetidos > 0 ? ` (${r.repetidos} ya estaban)` : ""}`,
  };
}

export async function marcarGrupoPortal(
  slug: string,
  launchId: string,
  groupId: string,
  lleno: boolean,
): Promise<{ error: string } | undefined> {
  const quien = await quienCarga(slug);
  if ("error" in quien) return quien;
  const r = await marcarGrupo(quien.ctx.clientId, groupId, lleno);
  if (r) return r;
  revalidar(quien.ctx.slug, launchId);
}

export async function borrarGrupoPortal(slug: string, launchId: string, groupId: string): Promise<{ error: string } | undefined> {
  const quien = await quienCarga(slug);
  if ("error" in quien) return quien;
  const r = await borrarGrupo(quien.ctx.clientId, groupId);
  if (r) return r;
  revalidar(quien.ctx.slug, launchId);
}
