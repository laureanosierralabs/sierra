import "server-only";
import type { Remitente } from "@/lib/email/marca";

/**
 * Envío de mails con Resend por HTTP (sin SDK). Nunca lanza: el que llama
 * decide qué hacer si el mail no salió.
 */
export type ResultadoEmail = { ok: true } | { ok: false; error: string };

/** Hay con qué enviar: clave de API y remitente (dominio verificado en Resend). */
export function resendConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
}

/**
 * Lo institucional sale de RESEND_FROM (team@); lo personal (los reportes),
 * de RESEND_FROM_PERSONAL (laureano@). Sin remitente personal, sale del equipo.
 */
function remitenteDe(r: Remitente | undefined): string | undefined {
  const equipo = process.env.RESEND_FROM?.trim();
  if (r === "personal") return process.env.RESEND_FROM_PERSONAL?.trim() || equipo;
  return equipo;
}

export async function enviarEmail(m: {
  to: string;
  subject: string;
  html: string;
  text: string;
  remitente?: Remitente;
}): Promise<ResultadoEmail> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = remitenteDe(m.remitente);
  if (!key || !from) return { ok: false, error: "Resend no está configurado" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.html, text: m.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    const cuerpo = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, error: cuerpo?.message ?? `Resend respondió ${res.status}` };
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return {
      ok: false,
      error: timeout ? "Resend tardó demasiado en responder" : "No se pudo conectar con Resend",
    };
  }
}
