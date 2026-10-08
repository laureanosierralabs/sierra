import { z } from "zod";

/**
 * Espejo de `url()` en app/landing-pages/acciones.ts: vacío, o una URL http(s)
 * válida. Solo http/https: un `javascript:` en un href es XSS.
 */
export const urlOpcional = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    if (v === "") return;
    let parsed: URL;
    try {
      parsed = new URL(v);
    } catch {
      ctx.addIssue({ code: "custom", message: "La URL no es válida" });
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      ctx.addIssue({ code: "custom", message: "La URL debe empezar con http:// o https://" });
    }
  });
