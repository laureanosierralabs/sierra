import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import {
  RUTA_PORTAL,
  esRutaPortal,
  esUsuarioCliente,
  parsearUnidades,
  puedeVerRuta,
  rutaInicial,
} from "@/lib/unidades";

const esPublica = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sin-acceso",
  // Cotización que se le manda al cliente: la protege el token del link.
  "/q/(.*)",
  // Diagnóstico: tiene que responder aunque el login esté roto.
  "/api/health",
  // Webhooks de proveedores (MailerLite): los protege el token de la URL y
  // la firma del proveedor, no una sesión.
  "/api/webhooks/(.*)",
  // Conteo de visitas: lo llama el script de las landings (otros dominios).
  "/api/t",
  // Clics de después del registro (WhatsApp, checkout): también desde las landings.
  "/api/e",
  // Link personal del webinar: lo abre quien recibió el correo, sin sesión.
  // Lo protege el token del lanzamiento.
  "/w/(.*)",
  // Link fijo del grupo de WhatsApp: lo abre quien se registró, sin sesión.
  // Lo protege el token del lanzamiento.
  "/g/(.*)",
  // Conversiones de proyectos conectados: las protege la firma del kit.
  "/api/ingest",
  // Crons de Vercel (reportes por mail): los protege CRON_SECRET en el header.
  "/api/cron/(.*)",
]);

/**
 * Deja pasar la request con la ruta actual en un header. El RootLayout es
 * server component y la necesita para no envolver en el panel interno las
 * pantallas que no son del panel (auth, cotización pública, portal). No hay
 * API server-side para leer el pathname en un layout.
 */
function seguir(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export default clerkMiddleware(async (auth, req) => {
  if (esPublica(req)) return seguir(req);

  const { userId } = await auth();
  // redirectToSignIn() manda a la pantalla alojada de Clerk. Acá se redirige
  // a /sign-in, que es la nuestra, conservando adónde queria ir.
  if (!userId) {
    const destino = new URL("/sign-in", req.url);
    destino.searchParams.set(
      "redirect_url",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(destino);
  }

  // El token de sesión de Core 3 no incluye publicMetadata, así que el rol se
  // lee del usuario. Verificado: los claims solo traen azp/exp/iss/sid/sub/v.
  //
  // Sin el rol no se sabe si es del equipo o un cliente, así que ante un
  // fallo de Clerk se corta (antes se dejaba pasar: con usuarios de clientes
  // eso abriría el panel interno). Se responde y no se lanza: una excepción
  // acá tumba la request y el host contesta 404 sin pista de qué pasó.
  let metadata: { role?: unknown; units?: unknown } | undefined;
  try {
    const cliente = await clerkClient();
    const usuario = await cliente.users.getUser(userId);
    metadata = usuario.publicMetadata as typeof metadata;
  } catch (e) {
    console.error("[proxy] no se pudo leer el usuario de Clerk:", e);
    return new NextResponse("No se pudo verificar tu acceso. Probá de nuevo en un momento.", {
      status: 503,
    });
  }

  // Un usuario de cliente vive en el portal y en ningún otro lado.
  if (esUsuarioCliente(metadata)) {
    if (esRutaPortal(req.nextUrl.pathname)) return seguir(req);
    return NextResponse.redirect(new URL(RUTA_PORTAL, req.url));
  }

  const esOwner = metadata?.role === "owner";
  const declaradas = parsearUnidades(metadata?.units);
  // Un member sin units cae a landing-pages: era el único acceso posible antes
  // de que este campo existiera.
  const unidades = declaradas.length > 0 ? declaradas : ["landing-pages" as const];

  if (puedeVerRuta(esOwner, unidades, req.nextUrl.pathname)) return seguir(req);

  const destino = rutaInicial(esOwner, unidades);
  if (req.nextUrl.pathname === destino) return seguir(req);
  return NextResponse.redirect(new URL(destino, req.url));
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
