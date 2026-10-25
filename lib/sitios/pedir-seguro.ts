import "server-only";

import { lookup } from "node:dns/promises";
import { ipPrivada } from "@/lib/lanzamientos/salud";

export interface Respuesta {
  /** Código HTTP final (después de seguir redirecciones); null si no hubo respuesta. */
  status: number | null;
  urlFinal: string;
  /** Solo si se pidió el cuerpo y es HTML. */
  html: string | null;
  ms: number;
  error: string | null;
}

const MAX_REDIRECCIONES = 5;

async function hostPublico(url: URL): Promise<string | null> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return "Solo se revisan links http(s)";
  if (url.username || url.password) return "El link tiene usuario y contraseña";
  try {
    const direcciones = await lookup(url.hostname, { all: true, verbatim: true });
    if (direcciones.length === 0 || direcciones.some((d) => ipPrivada(d.address))) {
      return "El link apunta a una red interna";
    }
  } catch {
    return "El dominio no existe (no resuelve)";
  }
  return null;
}

/** Lee como mucho `max` bytes del cuerpo: una página enorme no traba al panel. */
async function leerCuerpo(res: Response, max: number): Promise<string> {
  if (!res.body) return "";
  const lector = res.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < max) {
    const { done, value } = await lector.read();
    if (done) break;
    partes.push(value);
    total += value.byteLength;
  }
  await lector.cancel().catch(() => undefined);
  const todo = new Uint8Array(Math.min(total, max));
  let i = 0;
  for (const p of partes) {
    const corte = p.subarray(0, Math.max(0, todo.length - i));
    todo.set(corte, i);
    i += corte.byteLength;
    if (i >= todo.length) break;
  }
  return new TextDecoder().decode(todo);
}

/**
 * GET a un link cargado en el panel, con las defensas de quien pide URLs
 * ajenas desde un servidor: solo http(s), nada de IPs internas (se revisa en
 * cada redirección), tiempo y tamaño máximos. Nunca lanza.
 *
 * Límite conocido: entre la resolución DNS y el pedido el dominio podría
 * cambiar de IP (DNS rebinding). Lo mitiga que solo el owner carga los links
 * y que el panel no manda credenciales ni lee nada sensible de la respuesta.
 */
export async function pedirSeguro(
  direccion: string,
  { cuerpo = false, maxBytes = 1_500_000, timeoutMs = 8000 }: { cuerpo?: boolean; maxBytes?: number; timeoutMs?: number } = {},
): Promise<Respuesta> {
  const inicio = Date.now();
  const fin = (r: Omit<Respuesta, "ms">): Respuesta => ({ ...r, ms: Date.now() - inicio });

  let url: URL;
  try {
    url = new URL(direccion);
  } catch {
    return fin({ status: null, urlFinal: direccion, html: null, error: "No es un link válido" });
  }

  const senal = AbortSignal.timeout(timeoutMs);
  try {
    for (let salto = 0; salto <= MAX_REDIRECCIONES; salto++) {
      const bloqueo = await hostPublico(url);
      if (bloqueo) return fin({ status: null, urlFinal: url.toString(), html: null, error: bloqueo });

      const res = await fetch(url, {
        redirect: "manual",
        signal: senal,
        headers: { "User-Agent": "synxbuild-Verificador/1.0 (+https://app.synxbuild.com)", Accept: "text/html,*/*" },
        cache: "no-store",
      });

      const destino = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && destino) {
        await res.body?.cancel().catch(() => undefined);
        url = new URL(destino, url);
        continue;
      }

      const esHtml = (res.headers.get("content-type") ?? "").includes("text/html");
      const html = cuerpo && esHtml ? await leerCuerpo(res, maxBytes) : null;
      if (!html) await res.body?.cancel().catch(() => undefined);
      return fin({ status: res.status, urlFinal: url.toString(), html, error: null });
    }
    return fin({ status: null, urlFinal: url.toString(), html: null, error: "Demasiadas redirecciones" });
  } catch (e) {
    const tiempo = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return fin({
      status: null,
      urlFinal: url.toString(),
      html: null,
      error: tiempo ? `No respondió en ${timeoutMs / 1000} s` : "No se pudo conectar",
    });
  }
}
