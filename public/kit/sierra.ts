/**
 * Sierra Launch Kit · servidor (v1)
 *
 * Avisa al panel de sierra labs los registros y compras del proyecto, para
 * que el cliente los vea en vivo durante el lanzamiento. Usar SOLO desde el
 * servidor (server actions, route handlers, webhooks): firma con un secreto.
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   NEXT_PUBLIC_SIERRA_URL        URL del panel
 *   NEXT_PUBLIC_SIERRA_SITE_KEY   clave pública del proyecto
 *   SIERRA_INGEST_SECRET          secreto de firma (nunca con NEXT_PUBLIC_)
 *
 * Link personal del webinar con el dominio del cliente: sumar en next.config
 * el rewrite { source: "/vivo/:token", destination: `${NEXT_PUBLIC_SIERRA_URL}/w/:token` }.
 * El panel arma el link como https://<dominio de la landing>/vivo/<token>.
 *
 * Compras por links de pago de Stripe: el webhook recibe la ruta y los UTM en
 * `session.client_reference_id` (los pone <SierraTracking /> al hacer clic);
 * se leen con atribucionDeReferencia().
 *
 * Nunca lanza: si el panel no responde, el formulario o el pago siguen
 * funcionando igual. Llamar DESPUÉS de guardar el dato donde corresponda
 * (MailerLite, GoHighLevel, Stripe…), nunca en su lugar.
 */
import { createHmac, randomUUID } from "node:crypto";

export interface Atribucion {
  /** Ruta de la landing donde ocurrió, por ejemplo "/registro-a". */
  path?: string | null;
  utm?: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
  };
}

interface DatosBase extends Atribucion {
  /** Id único del envío. Con el mismo id, un reintento no se cuenta dos veces. */
  id?: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  occurredAt?: Date;
}

async function enviar(
  type: "lead" | "purchase",
  datos: DatosBase & { amount?: number; currency?: string },
): Promise<void> {
  const panel = process.env.NEXT_PUBLIC_SIERRA_URL;
  const sitio = process.env.NEXT_PUBLIC_SIERRA_SITE_KEY;
  const secreto = process.env.SIERRA_INGEST_SECRET;
  if (!panel || !sitio || !secreto) {
    console.warn("[sierra] faltan variables de entorno: el evento no se envió");
    return;
  }

  const cuerpo = JSON.stringify({
    type,
    id: datos.id ?? randomUUID(),
    path: datos.path ?? null,
    email: datos.email ?? null,
    name: datos.name ?? null,
    phone: datos.phone ?? null,
    amount: datos.amount ?? null,
    currency: datos.currency ?? null,
    utm: datos.utm ?? {},
    occurred_at: (datos.occurredAt ?? new Date()).toISOString(),
  });
  const timestamp = String(Date.now());
  const firma = createHmac("sha256", secreto).update(`${timestamp}.${cuerpo}`).digest("hex");

  try {
    const respuesta = await fetch(`${panel.replace(/\/+$/, "")}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sierra-site": sitio,
        "x-sierra-timestamp": timestamp,
        "x-sierra-signature": firma,
      },
      body: cuerpo,
      signal: AbortSignal.timeout(4000),
    });
    if (!respuesta.ok) {
      console.warn("[sierra] el panel rechazó el evento:", respuesta.status, await respuesta.text().catch(() => ""));
    }
  } catch (error) {
    console.warn("[sierra] no se pudo avisar al panel:", error);
  }
}

/** Un registro (lead) en una landing. */
export function registrarLead(datos: DatosBase & { email: string }): Promise<void> {
  return enviar("lead", datos);
}

/** Una compra confirmada (llamar desde el webhook de pagos, no desde el checkout). */
export function registrarCompra(
  datos: DatosBase & { amount: number; currency: string },
): Promise<void> {
  return enviar("purchase", datos);
}

/**
 * Ruta y UTM que <SierraTracking /> empaquetó en el `client_reference_id` de
 * un link de pago de Stripe. Null si no vino o no es una referencia del kit.
 */
export function atribucionDeReferencia(ref: string | null | undefined): Atribucion | null {
  if (!ref || !/^[A-Za-z0-9_-]{1,200}$/.test(ref)) return null;
  try {
    const datos = JSON.parse(Buffer.from(ref, "base64url").toString("utf8")) as Record<string, unknown>;
    if (!datos || typeof datos.p !== "string" || !datos.p.startsWith("/")) return null;
    const texto = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 120) : null);
    return {
      path: datos.p.slice(0, 200),
      utm: { utm_source: texto(datos.s), utm_campaign: texto(datos.c), utm_content: texto(datos.a) },
    };
  } catch {
    return null;
  }
}

/**
 * Lee la atribución que <SierraCampos /> agrega al formulario (ruta y UTM).
 * Para server actions que reciben un FormData.
 */
export function atribucionDe(fd: FormData): Atribucion {
  const valor = (nombre: string) => {
    const v = fd.get(nombre);
    return typeof v === "string" && v !== "" ? v : null;
  };
  return {
    path: valor("sl_path"),
    utm: {
      utm_source: valor("utm_source"),
      utm_medium: valor("utm_medium"),
      utm_campaign: valor("utm_campaign"),
      utm_content: valor("utm_content"),
    },
  };
}
