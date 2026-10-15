"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { cifrar, hayClave } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import {
  ESTADOS_LANZAMIENTO,
  TIPOS_LANDING,
  tipoLandingDeProyecto,
  type EstadoLanzamiento,
  type TipoLanding,
} from "@/lib/lanzamientos/tipos";
import { rutasDeSitio } from "@/lib/sitios/datos";
import { landingDesdeProyecto, normalizarRuta } from "@/lib/sitios/tipos";
import { registroValido, TOPE_IMPORTACION } from "@/lib/lanzamientos/importar";

/**
 * Gestión de lanzamientos desde el panel. Todo exige owner. Los fallos se
 * devuelven como `{ error }` (en producción Next oculta el mensaje de un
 * Error lanzado).
 */
type Resultado = { error: string } | undefined;

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar lanzamientos");
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
const opcional = (fd: FormData, campo: string) => texto(fd, campo) || null;

function fecha(fd: FormData, campo: string): string | null | undefined {
  const v = texto(fd, campo);
  if (v === "") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

/** Solo http/https: estos links se muestran clickeables en el portal. */
function enlace(fd: FormData, campo: string): string | null | undefined {
  const v = texto(fd, campo);
  if (v === "") return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function revalidar(clientId: string, launchId?: string) {
  revalidatePath(`/landing-pages/clients/${clientId}`);
  if (launchId) revalidatePath(`/landing-pages/launches/${launchId}`);
}

export async function guardarLanzamiento(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const nombre = texto(fd, "name");
  if (!nombre) return { error: "Falta el nombre del lanzamiento" };

  const estado = (texto(fd, "status") || "preparacion") as EstadoLanzamiento;
  if (!ESTADOS_LANZAMIENTO.includes(estado)) return { error: "Estado inválido" };

  const inicio = fecha(fd, "starts_on");
  const fin = fecha(fd, "ends_on");
  if (inicio === undefined || fin === undefined) return { error: "Fecha inválida" };
  if (inicio && fin && fin < inicio) return { error: "El cierre no puede ser anterior al inicio" };

  const metaCruda = texto(fd, "goal_registrations");
  const meta = metaCruda === "" ? null : Number(metaCruda);
  if (meta !== null && (!Number.isInteger(meta) || meta <= 0)) {
    return { error: "La meta tiene que ser un número entero mayor a cero" };
  }

  const fila = {
    name: nombre,
    status: estado,
    starts_on: inicio,
    ends_on: fin,
    goal_registrations: meta,
    updated_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  const id = texto(fd, "id");

  if (id) {
    const { data, error } = await db.from("launches").update(fila).eq("id", id).select("client_id").maybeSingle();
    if (error || !data) return { error: `No se pudo guardar: ${error?.message ?? "no existe"}` };
    revalidar(data.client_id as string, id);
    return;
  }

  const clientId = texto(fd, "client_id");
  if (!clientId) return { error: "Falta el cliente" };

  const { error } = await db.from("launches").insert({
    ...fila,
    client_id: clientId,
    webhook_token: randomBytes(24).toString("base64url"),
  });
  if (error) return { error: `No se pudo crear: ${error.message}` };
  revalidar(clientId);
}

export async function borrarLanzamiento(id: string): Promise<Resultado> {
  await exigirOwner();
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .delete()
    .eq("id", id)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  if (data) revalidar(data.client_id as string, id);
}

export async function guardarPaginaLanzamiento(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const launchId = texto(fd, "launch_id");
  const nombre = texto(fd, "name");
  if (!launchId) return { error: "Falta el lanzamiento" };
  if (!nombre) return { error: "Falta el nombre de la landing" };

  const links = {
    url: enlace(fd, "url"),
    thanks_url: enlace(fd, "thanks_url"),
    whatsapp_url: enlace(fd, "whatsapp_url"),
    checkout_url: enlace(fd, "checkout_url"),
  };
  if (Object.values(links).includes(undefined)) {
    return { error: "Los links tienen que empezar con http:// o https://" };
  }

  const db = supabaseAdmin();
  // El cliente sale del lanzamiento, nunca del form: es la clave de aislamiento.
  const { data: lanzamiento } = await db
    .from("launches")
    .select("client_id")
    .eq("id", launchId)
    .maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };
  const clientId = lanzamiento.client_id as string;

  // El proyecto tiene que ser de ESTE cliente: el id viene del navegador.
  const projectId = opcional(fd, "project_id");
  if (projectId) {
    const { data: proyecto } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!proyecto) return { error: "Ese proyecto no es de este cliente" };
  }

  // Ruta de un proyecto conectado: el proyecto tiene que ser de ESTE cliente.
  const siteId = opcional(fd, "site_id");
  const ruta = siteId ? normalizarRuta(texto(fd, "path")) : null;
  if (siteId) {
    if (!ruta) return { error: "Indicá la ruta de la landing en el proyecto (por ejemplo /registro-a)" };
    const { data: sitio } = await db
      .from("client_sites")
      .select("id")
      .eq("id", siteId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!sitio) return { error: "Ese proyecto conectado no es de este cliente" };
  }

  const tipo = texto(fd, "kind") || "registro";
  if (!TIPOS_LANDING.includes(tipo as TipoLanding)) return { error: "Tipo de landing inválido" };

  const fila = {
    name: nombre,
    kind: tipo as TipoLanding,
    ...links,
    site_id: siteId,
    path: ruta,
    project_id: projectId,
    // Con proyecto conectado, los registros llegan por el kit: el grupo de
    // MailerLite duplicaría a cada persona.
    mailerlite_group_id: siteId ? null : opcional(fd, "mailerlite_group_id"),
  };

  const id = texto(fd, "id");
  const repetido =
    "Ese grupo de MailerLite o esa ruta del proyecto ya está asignada a otra landing de este lanzamiento";

  if (id) {
    const { error } = await db.from("launch_pages").update(fila).eq("id", id).eq("launch_id", launchId);
    if (error) return { error: error.code === "23505" ? repetido : `No se pudo guardar: ${error.message}` };
  } else {
    const { count } = await db
      .from("launch_pages")
      .select("id", { count: "exact", head: true })
      .eq("launch_id", launchId);
    const { error } = await db
      .from("launch_pages")
      .insert({ ...fila, launch_id: launchId, client_id: clientId, position: count ?? 0 });
    if (error) return { error: error.code === "23505" ? repetido : `No se pudo crear: ${error.message}` };
  }

  revalidar(clientId, launchId);
}

/**
 * Suma de una vez varias landings a partir de proyectos ya cargados del
 * cliente: nombre, URL, proyecto conectado y ruta salen del proyecto. Lo que
 * no se puede deducir queda vacío para completarlo a mano.
 */
export async function agregarLandingsDesdeProyectos(fd: FormData): Promise<Resultado> {
  await exigirOwner();

  const launchId = texto(fd, "launch_id");
  const elegidos = [...new Set(fd.getAll("project_ids").map(String).filter(Boolean))];
  if (!launchId) return { error: "Falta el lanzamiento" };
  if (elegidos.length === 0) return { error: "Elegí al menos una landing" };

  const db = supabaseAdmin();
  const { data: lanzamiento } = await db.from("launches").select("client_id").eq("id", launchId).maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };
  const clientId = lanzamiento.client_id as string;

  // Solo proyectos de ESTE cliente: los ids vienen del navegador.
  const [{ data: proyectos, error: errorProyectos }, { data: sitios }, { data: actuales }] = await Promise.all([
    db.from("projects").select("id, name, site_url, page_type").eq("client_id", clientId).in("id", elegidos),
    db.from("client_sites").select("id, domain").eq("client_id", clientId),
    db.from("launch_pages").select("project_id, site_id, path").eq("launch_id", launchId),
  ]);
  if (errorProyectos) return { error: "No se pudieron leer los proyectos" };
  if (!proyectos?.length) return { error: "Esos proyectos no son de este cliente" };

  // Un proyecto conectado sin dominio cargado solo se asigna por rutas que ya
  // registraron visitas (ver landingDesdeProyecto).
  const conRutas = await Promise.all(
    (sitios ?? []).map(async (s) => ({
      ...s,
      rutas: s.domain ? [] : (await rutasDeSitio(clientId, s.id).catch(() => [])).map((r) => r.path),
    })),
  );

  const yaEstan = new Set((actuales ?? []).map((p) => p.project_id).filter(Boolean));
  const rutasUsadas = new Set((actuales ?? []).filter((p) => p.site_id).map((p) => `${p.site_id} ${p.path}`));
  // Mismo orden en que aparecen elegidos.
  const orden = new Map(elegidos.map((id, i) => [id, i]));
  const nuevos = proyectos
    .filter((p) => !yaEstan.has(p.id))
    .sort((a, b) => (orden.get(a.id) ?? 0) - (orden.get(b.id) ?? 0));

  let posicion = actuales?.length ?? 0;
  const filas = nuevos.map((p) => {
    const sugerida = landingDesdeProyecto(p, conRutas);
    // Dos proyectos con la misma URL: la ruta va solo en la primera.
    const clave = `${sugerida.site_id} ${sugerida.path}`;
    const conRuta = sugerida.site_id && !rutasUsadas.has(clave);
    if (conRuta) rutasUsadas.add(clave);
    return {
      launch_id: launchId,
      client_id: clientId,
      project_id: p.id,
      name: sugerida.name,
      kind: tipoLandingDeProyecto(p.page_type as string | null),
      url: sugerida.url,
      site_id: conRuta ? sugerida.site_id : null,
      path: conRuta ? sugerida.path : null,
      position: posicion++,
    };
  });

  if (filas.length > 0) {
    const { error } = await db.from("launch_pages").insert(filas);
    if (error) {
      return {
        error:
          error.code === "23505"
            ? "Alguna de esas landings ya está en el lanzamiento (recargá la página)"
            : `No se pudieron agregar las landings: ${error.message}`,
      };
    }
  }
  revalidar(clientId, launchId);
}

/**
 * Importa registros de un CSV (ya leído en el navegador) a un lanzamiento:
 * sirve para recuperar lanzamientos que corrieron antes de conectar el panel.
 * Cada fila se vuelve a validar acá. Idempotente: reimportar el mismo archivo
 * no duplica (un email cuenta una vez por lanzamiento).
 */
export async function importarRegistros(fd: FormData): Promise<Resultado | { aviso: string }> {
  await exigirOwner();

  const launchId = texto(fd, "launch_id");
  const pageId = opcional(fd, "page_id");
  if (!launchId) return { error: "Falta el lanzamiento" };

  let crudos: unknown;
  try {
    crudos = JSON.parse(texto(fd, "registros") || "[]");
  } catch {
    return { error: "No se pudo leer el archivo" };
  }
  if (!Array.isArray(crudos) || crudos.length === 0) return { error: "El archivo no tiene registros con email" };
  if (crudos.length > TOPE_IMPORTACION) {
    return { error: `Máximo ${TOPE_IMPORTACION} registros por vez: dividí el archivo` };
  }

  const db = supabaseAdmin();
  // El cliente sale del lanzamiento, nunca del form.
  const { data: lanzamiento } = await db.from("launches").select("client_id").eq("id", launchId).maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };
  const clientId = lanzamiento.client_id as string;

  if (pageId) {
    const { data: pagina } = await db
      .from("launch_pages")
      .select("id")
      .eq("id", pageId)
      .eq("launch_id", launchId)
      .maybeSingle();
    if (!pagina) return { error: "Esa landing no es de este lanzamiento" };
  }

  // Un email que ya entró a este lanzamiento (por MailerLite o por otra
  // importación) no se vuelve a contar.
  const yaRegistrados = new Set<string>();
  // Importados antes sin datos extra: reimportar el archivo los completa.
  const importadosSinExtra = new Set<string>();
  for (let desde = 0; ; desde += 1000) {
    const { data: lote, error: errorLectura } = await db
      .from("launch_registrations")
      .select("email, source, extra")
      .eq("launch_id", launchId)
      .eq("client_id", clientId)
      .range(desde, desde + 999);
    if (errorLectura) return { error: "No se pudieron leer los registros actuales" };
    for (const f of lote ?? []) {
      const email = String(f.email).toLowerCase();
      yaRegistrados.add(email);
      if (f.source === "import" && Object.keys((f.extra as object | null) ?? {}).length === 0) {
        importadosSinExtra.add(email);
      }
    }
    if ((lote ?? []).length < 1000) break;
  }

  const ahora = new Date().toISOString();
  const vistos = new Set<string>(yaRegistrados);
  let yaEstaban = 0;
  const filas = [];
  const completar: { email: string; extra: Record<string, string> }[] = [];
  for (const crudo of crudos) {
    const r = registroValido((crudo ?? {}) as Record<string, unknown>);
    if (!r) continue;
    if (vistos.has(r.email)) {
      if (yaRegistrados.has(r.email)) {
        yaEstaban++;
        if (importadosSinExtra.delete(r.email) && Object.keys(r.extra).length > 0) {
          completar.push({ email: r.email, extra: r.extra });
        }
      }
      continue;
    }
    vistos.add(r.email);
    filas.push({
      launch_id: launchId,
      client_id: clientId,
      page_id: pageId,
      external_id: `import:${r.email}`,
      email: r.email,
      name: r.name,
      phone: r.phone,
      utm_source: r.utm_source,
      extra: r.extra,
      source: "import",
      registered_at: r.registered_at ?? ahora,
    });
  }
  // Solo se completa lo que estaba vacío: nunca se pisan datos ya guardados.
  let completados = 0;
  for (let i = 0; i < completar.length; i += 25) {
    const tanda = await Promise.all(
      completar.slice(i, i + 25).map((c) =>
        db
          .from("launch_registrations")
          .update({ extra: c.extra })
          .eq("launch_id", launchId)
          .eq("client_id", clientId)
          .eq("external_id", `import:${c.email}`)
          .eq("extra", "{}"),
      ),
    );
    completados += tanda.filter((t) => !t.error).length;
  }
  const conCompletados = completados > 0 ? ` y se completaron los datos extra de ${completados}` : "";

  if (filas.length === 0) {
    if (yaEstaban === 0) return { error: "Ninguna fila tiene un email válido" };
    revalidar(clientId, launchId);
    return { aviso: `Todos esos emails ya estaban en el lanzamiento${conCompletados || ": no se importó nada"}` };
  }

  let nuevos = 0;
  for (let i = 0; i < filas.length; i += 500) {
    const { data, error } = await db
      .from("launch_registrations")
      .upsert(filas.slice(i, i + 500), { onConflict: "launch_id,external_id", ignoreDuplicates: true })
      .select("id");
    if (error) {
      revalidar(clientId, launchId);
      return { error: `Se importaron ${nuevos} y falló el resto: ${error.message}` };
    }
    nuevos += data?.length ?? 0;
  }

  revalidar(clientId, launchId);
  // Lo que el upsert ignoró (una importación en paralelo) también ya estaba.
  yaEstaban += filas.length - nuevos;
  return {
    aviso: `${nuevos} registros importados${yaEstaban > 0 ? ` (${yaEstaban} ya estaban)` : ""}${conCompletados}`,
  };
}

/**
 * Desconecta MailerLite de un lanzamiento. Cambia el token de la URL del
 * webhook, así lo que siga mandando MailerLite rebota. Con la API key, además
 * borra el webhook en la cuenta del cliente (la key se usa y no se guarda).
 */
export async function desconectarMailerlite(fd: FormData): Promise<Resultado | { aviso: string }> {
  await exigirOwner();

  const launchId = texto(fd, "launch_id");
  const apiKey = texto(fd, "api_key");
  if (!launchId) return { error: "Falta el lanzamiento" };

  const db = supabaseAdmin();
  const { data: lanzamiento } = await db
    .from("launches")
    .select("client_id, mailerlite_webhook_id")
    .eq("id", launchId)
    .maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };

  let borradoEnMailerlite = false;
  if (apiKey && lanzamiento.mailerlite_webhook_id) {
    try {
      const res = await fetch(
        `https://connect.mailerlite.com/api/webhooks/${encodeURIComponent(String(lanzamiento.mailerlite_webhook_id))}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
        },
      );
      // 404: ya no existía en MailerLite, que es lo que se buscaba.
      borradoEnMailerlite = res.ok || res.status === 404;
      if (!borradoEnMailerlite) return { error: `MailerLite no borró el webhook (HTTP ${res.status}): revisá la API key` };
    } catch {
      return { error: "No se pudo hablar con MailerLite" };
    }
  }

  const { error } = await db
    .from("launches")
    .update({
      webhook_token: randomBytes(24).toString("base64url"),
      mailerlite_webhook_id: null,
      webhook_secret_encrypted: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", launchId);
  if (error) return { error: `No se pudo desconectar: ${error.message}` };

  revalidar(lanzamiento.client_id as string, launchId);
  return {
    aviso: borradoEnMailerlite
      ? "MailerLite desconectado y webhook borrado"
      : "MailerLite desconectado. El webhook quedó en MailerLite pero ya no recibe nada: podés borrarlo en Integraciones → Webhooks",
  };
}

export async function borrarPaginaLanzamiento(id: string): Promise<Resultado> {
  await exigirOwner();
  const { data, error } = await supabaseAdmin()
    .from("launch_pages")
    .delete()
    .eq("id", id)
    .select("client_id, launch_id")
    .maybeSingle();
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  if (data) revalidar(data.client_id as string, data.launch_id as string);
}

export interface GrupoMailerlite {
  id: string;
  name: string;
}

/**
 * Crea el webhook en la cuenta de MailerLite del cliente y guarda su secreto
 * de firma (cifrado). La API key se usa en esta llamada y NO se guarda: para
 * recibir registros no hace falta, y así no custodiamos la llave de la cuenta
 * de mail del cliente. Devuelve los grupos de la cuenta para mapear landings.
 */
export async function conectarMailerlite(
  fd: FormData,
): Promise<{ error: string } | { grupos: GrupoMailerlite[] }> {
  await exigirOwner();

  const launchId = texto(fd, "launch_id");
  const apiKey = texto(fd, "api_key");
  if (!launchId) return { error: "Falta el lanzamiento" };
  if (!apiKey) return { error: "Pegá la API key de MailerLite" };
  if (!hayClave()) return { error: "Falta configurar CREDENTIALS_KEY en el servidor para cifrar el secreto" };

  const db = supabaseAdmin();
  const { data: lanzamiento } = await db
    .from("launches")
    .select("client_id, name, webhook_token, mailerlite_webhook_id")
    .eq("id", launchId)
    .maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };

  const cabeceras = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const api = "https://connect.mailerlite.com/api";

  try {
    if (!lanzamiento.mailerlite_webhook_id) {
      const h = await headers();
      const host = h.get("x-forwarded-host") ?? h.get("host");
      if (!host) return { error: "No se pudo determinar la URL pública del panel" };
      const url = `https://${host}/api/webhooks/mailerlite/${lanzamiento.webhook_token}`;

      const res = await fetch(`${api}/webhooks`, {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({
          name: `Sierra Labs · ${lanzamiento.name}`,
          events: ["subscriber.added_to_group"],
          url,
          enabled: true,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const cuerpo = (await res.json().catch(() => null)) as {
        data?: { id?: string | number; secret?: string };
        message?: string;
      } | null;
      if (!res.ok || !cuerpo?.data?.id || !cuerpo.data.secret) {
        const detalle = cuerpo?.message ?? `HTTP ${res.status}`;
        return { error: `MailerLite no creó el webhook: ${detalle}` };
      }

      const { error } = await db
        .from("launches")
        .update({
          mailerlite_webhook_id: String(cuerpo.data.id),
          webhook_secret_encrypted: cifrar(cuerpo.data.secret),
          updated_at: new Date().toISOString(),
        })
        .eq("id", launchId);
      if (error) {
        // Sin guardar el secreto no se puede validar la firma: se borra el
        // webhook recién creado para no dejarlo huérfano en la cuenta del cliente.
        await fetch(`${api}/webhooks/${cuerpo.data.id}`, {
          method: "DELETE",
          headers: cabeceras,
          signal: AbortSignal.timeout(10_000),
        }).catch(() => undefined);
        return { error: `No se pudo guardar la conexión: ${error.message}` };
      }
    }

    const resGrupos = await fetch(`${api}/groups?limit=100`, {
      headers: cabeceras,
      signal: AbortSignal.timeout(10_000),
    });
    const grupos = (await resGrupos.json().catch(() => null)) as {
      data?: { id: string | number; name: string }[];
    } | null;

    revalidar(lanzamiento.client_id as string, launchId);
    return { grupos: (grupos?.data ?? []).map((g) => ({ id: String(g.id), name: g.name })) };
  } catch (e) {
    return { error: `No se pudo hablar con MailerLite: ${e instanceof Error ? e.message : "error de red"}` };
  }
}
