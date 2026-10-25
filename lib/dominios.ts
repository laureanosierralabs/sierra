/**
 * Dominios del panel. Lógica pura (sin I/O): la usa proxy.ts y se prueba en node.
 *
 * - DOMINIO_PANEL: el dominio principal del panel (app.synxbuild.com).
 * - DOMINIOS_VIEJOS: dominios anteriores (app.laureanosierra.com), separados por coma.
 *   Las páginas se redirigen al principal para que los links ya enviados sigan
 *   andando; /api NO se redirige, porque lo llaman servidores (landings,
 *   webhooks) con POST, que no siguen redirecciones.
 * - DOMINIO_CLIENTES: el dominio del portal (clientes.synxbuild.com). Ahí
 *   /pilar-sousa muestra /portal/pilar-sousa.
 *
 * Sin DOMINIO_PANEL no se redirige nada: se activa recién cuando el login
 * (Clerk) ya funciona en el dominio nuevo.
 */

export interface EntornoDominios {
  DOMINIO_PANEL?: string;
  DOMINIOS_VIEJOS?: string;
  DOMINIO_CLIENTES?: string;
}

export type DecisionDominio =
  | { tipo: "seguir" }
  | { tipo: "redirigir"; url: string }
  | { tipo: "portal"; ruta: string };

const limpio = (h: string | null | undefined) => (h ?? "").trim().toLowerCase().replace(/:\d+$/, "");

/** Rutas que en el dominio de clientes se atienden tal cual (no son del portal). */
const PROPIAS = ["/api/", "/sign-in", "/sign-up", "/portal", "/w/", "/g/", "/q/", "/sin-acceso"];

export function decidirDominio(host: string | null | undefined, pathname: string, search: string, env: EntornoDominios): DecisionDominio {
  const h = limpio(host);
  const panel = limpio(env.DOMINIO_PANEL);
  const clientes = limpio(env.DOMINIO_CLIENTES);
  const viejos = (env.DOMINIOS_VIEJOS ?? "").split(",").map(limpio).filter(Boolean);

  // /w y /g (webinar y grupo) tampoco: las landings los reenvían por el dominio
  // viejo y una redirección le mostraría al visitante el dominio del panel.
  const sinRedireccion = ["/api/", "/w/", "/g/"].some((p) => pathname.startsWith(p));
  if (panel && viejos.includes(h) && !sinRedireccion) {
    return { tipo: "redirigir", url: `https://${panel}${pathname}${search}` };
  }

  const propia = PROPIAS.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
  if (clientes && h === clientes && !propia) {
    return { tipo: "portal", ruta: pathname === "/" ? "/portal" : `/portal${pathname}` };
  }

  return { tipo: "seguir" };
}
