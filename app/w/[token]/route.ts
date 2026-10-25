import { supabaseAdmin } from "@/lib/landing/supabase";
import { normalizarEmail } from "@/lib/lanzamientos/listas";
import { diaDe, esBot } from "@/lib/lanzamientos/tipos";

export const dynamic = "force-dynamic";

/** Ingresos registrados por lanzamiento y día: holgado para un webinar real. */
const MAX_INGRESOS_POR_DIA = 20_000;

type Contexto = { params: Promise<{ token: string }> };

/**
 * Link personal del webinar. Ruta pública (ver proxy.ts y app/layout.tsx): la
 * protege el token del lanzamiento, que va en el link y no es adivinable.
 *
 *   GET  /w/<token>?e=<email>  → registra el ingreso y redirige (302) al Zoom
 *   GET  /w/<token>            → pide el email en una página mínima
 *   POST /w/<token>  (e=...)   → igual que el GET con email
 *
 * El link se pega en el correo de MailerLite o GoHighLevel con la variable del
 * email de cada contacto. En el correo va con el dominio del cliente
 * (<landing>/vivo/<token>): la landing lo reenvía acá, y por eso el formulario
 * se envía a su propia URL y no a /w/. Registrar el ingreso nunca bloquea la entrada: si
 * la base falla, igual se redirige.
 */
export async function GET(req: Request, { params }: Contexto) {
  const { token } = await params;
  const email = new URL(req.url).searchParams.get("e");
  return atender(req, token, email, "get");
}

export async function POST(req: Request, { params }: Contexto) {
  const { token } = await params;
  let email: string | null = null;
  try {
    const valor = (await req.formData()).get("e");
    email = typeof valor === "string" ? valor : null;
  } catch {
    email = null;
  }
  return atender(req, token, email, "post");
}

async function atender(req: Request, token: string, emailCrudo: string | null, metodo: "get" | "post") {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return pagina("No encontramos este link", "Revisá que esté completo.", 404);

  const db = supabaseAdmin();
  const { data: lanzamiento, error } = await db
    .from("launches")
    .select("id, client_id, webinar_url")
    .eq("webinar_token", token)
    .maybeSingle();
  if (error) console.error("[webinar] no se pudo leer el lanzamiento:", error.message);
  if (!lanzamiento) return pagina("No encontramos este link", "Revisá que esté completo.", 404);

  const destino = urlSegura(lanzamiento.webinar_url as string | null);
  if (!destino) {
    return pagina("El link todavía no está disponible", "Todavía no cargamos el link del webinar. Volvé a intentarlo un poco más tarde.");
  }

  const email = normalizarEmail(emailCrudo);
  if (!email) {
    // Un link con la variable sin reemplazar ("{$email}") trae algo que no es un email.
    const aviso = emailCrudo?.trim() && metodo === "post" ? "Ese email no parece válido. Revisalo e intentá de nuevo." : null;
    return formulario(token, aviso);
  }

  // Los previsualizadores de correo y los antivirus abren el link antes que la
  // persona: ese pedido no es un ingreso.
  // El link circula en mails masivos: un tope diario por lanzamiento evita que
  // alguien con el link llene la tabla de emails inventados. Pasado el tope,
  // la persona igual entra al webinar; solo no se registra.
  const { count: ingresosHoy } = await db
    .from("launch_events")
    .select("id", { count: "exact", head: true })
    .eq("launch_id", lanzamiento.id)
    .eq("day", diaDe(new Date()));
  const bajoElTope = (ingresosHoy ?? 0) < MAX_INGRESOS_POR_DIA;

  if (bajoElTope && !esBot(req.headers.get("user-agent"))) {
    const { error: errEvento } = await db.from("launch_events").insert({
      launch_id: lanzamiento.id,
      client_id: lanzamiento.client_id,
      kind: "webinar_join",
      email,
      day: diaDe(new Date()),
    });
    // 23505 = ya entró hoy: lo esperado al volver a abrir el link.
    if (errEvento && errEvento.code !== "23505") {
      console.error("[webinar] no se pudo registrar el ingreso:", errEvento.message);
    }
  }

  return new Response(null, {
    status: 302,
    headers: { Location: destino, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

/** Solo http/https: el link lo carga el owner, pero igual no se redirige a otra cosa. */
function urlSegura(valor: string | null): string | null {
  if (!valor) return null;
  try {
    const u = new URL(valor);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/* ───────────── Páginas mínimas ───────────── */

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function documento(contenido: string, estado = 200) {
  // Estilos propios y en línea: esta ruta no pasa por el layout del panel ni
  // del portal. Los colores son los del portal (fondo neutral-950, primary-500).
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Webinar</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:100%;max-width:26rem}
h1{margin:0 0 .75rem;font-size:1.5rem;line-height:1.2;font-weight:800;letter-spacing:-.02em}
p{margin:0 0 1.25rem;color:rgba(255,255,255,.65);line-height:1.5;font-size:.95rem}
label{display:block;margin-bottom:.4rem;font-size:.85rem;font-weight:600}
input{width:100%;padding:.8rem 1rem;border-radius:.75rem;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;font-size:1rem}
input:focus-visible{outline:2px solid #5073ff;outline-offset:2px}
button{width:100%;margin-top:1rem;padding:.85rem 1rem;border:0;border-radius:999px;background:#0000ff;color:#fff;font-size:1rem;font-weight:700;cursor:pointer}
button:hover{background:#5073ff}
.aviso{color:#fca5a5;margin:.75rem 0 0;font-size:.85rem}
</style>
</head>
<body><main>${contenido}</main></body>
</html>`;
  return new Response(html, {
    status: estado,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function pagina(titulo: string, detalle: string, estado = 200) {
  return documento(`<h1>${escapar(titulo)}</h1><p>${escapar(detalle)}</p>`, estado);
}

function formulario(token: string, aviso: string | null) {
  return documento(`<h1>Entrá al webinar</h1>
<p>Escribí el email con el que te registraste para entrar.</p>
<form method="post">
<label for="e">Tu email</label>
<input id="e" name="e" type="email" inputmode="email" autocomplete="email" required autofocus placeholder="vos@ejemplo.com">
${aviso ? `<p class="aviso" role="alert">${escapar(aviso)}</p>` : ""}
<button type="submit">Entrar al webinar</button>
</form>`);
}
