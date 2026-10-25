"use server";

import { revalidatePath } from "next/cache";
import { nombreDe, usuarioActual } from "@/lib/landing/auth";
import { guardarDestinoWebinar, marcarLugar } from "@/lib/lanzamientos/enlaces-datos";
import { urlDestino } from "@/lib/lanzamientos/enlaces";
import { contextoPortal, type ContextoPortal } from "@/lib/portal/contexto";

/**
 * Enlaces del lanzamiento desde el portal: el cliente edita el destino del
 * webinar y tilda dónde puso cada link. El cliente sale SIEMPRE del contexto
 * del portal (su organización), nunca del formulario, y cada cambio filtra por
 * él. La vista interna del owner es de solo lectura: él lo hace desde el panel.
 */
type Resultado = { error: string } | { aviso: string };

async function quienCambia(slug: string): Promise<{ ctx: ContextoPortal; nombre: string } | { error: string }> {
  const ctx = await contextoPortal(slug);
  if (!ctx) return { error: "No encontrado" };
  if (ctx.vistaInterna) return { error: "Estás en la vista interna del portal: haz el cambio desde el panel" };
  const usuario = await usuarioActual();
  if (!usuario) return { error: "No autorizado" };
  return { ctx, nombre: nombreDe(usuario) };
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

function revalidar(slug: string, launchId: string) {
  revalidatePath(`/portal/${slug}/lanzamientos/${launchId}`);
  revalidatePath(`/landing-pages/launches/${launchId}`);
}

export async function guardarWebinarPortal(fd: FormData): Promise<Resultado> {
  const quien = await quienCambia(texto(fd, "slug"));
  if ("error" in quien) return quien;
  const launchId = texto(fd, "launch_id");
  if (!launchId) return { error: "Falta el lanzamiento" };
  const url = urlDestino(texto(fd, "webinar_url"));
  if (url === undefined) return { error: "El link del webinar tiene que empezar con http:// o https://" };

  const r = await guardarDestinoWebinar(quien.ctx.clientId, launchId, url);
  if (r) return r;
  revalidar(quien.ctx.slug, launchId);
  return { aviso: url ? "Link del webinar guardado" : "Link del webinar quitado" };
}

export async function marcarLugarPortal(
  slug: string,
  launchId: string,
  link: string,
  placement: string,
  marcado: boolean,
): Promise<{ error: string } | undefined> {
  const quien = await quienCambia(slug);
  if ("error" in quien) return quien;
  const r = await marcarLugar(quien.ctx.clientId, launchId, link, placement, marcado, quien.nombre);
  if (r) return r;
  revalidar(quien.ctx.slug, launchId);
}
