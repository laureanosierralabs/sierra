import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { parsearUnidades, puedeVerRuta, rutaInicial } from "@/lib/unidades";

const esPublica = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sin-acceso",
  // Diagnóstico: tiene que responder aunque el login esté roto.
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  if (esPublica(req)) {
    // El RootLayout es server component y necesita saber la ruta actual para
    // ocultar el Sidebar en /sign-in y /sign-up (no hay route group propio
    // para esas pantallas). No hay API server-side para leer el pathname en
    // un layout, así que viaja por header seteado acá.
    const headers = new Headers(req.headers);
    headers.set("x-pathname", req.nextUrl.pathname);
    return NextResponse.next({ request: { headers } });
  }

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
  // Una excepción acá tumba toda la request y el host responde 404 sin pista
  // de qué pasó. Ante un fallo de Clerk se deja pasar: la página igual valida
  // sesión del lado del servidor.
  let metadata: { role?: unknown; units?: unknown } | undefined;
  try {
    const cliente = await clerkClient();
    const usuario = await cliente.users.getUser(userId);
    metadata = usuario.publicMetadata as typeof metadata;
  } catch (e) {
    console.error("[proxy] no se pudo leer el usuario de Clerk:", e);
    return;
  }

  const esOwner = metadata?.role === "owner";
  const declaradas = parsearUnidades(metadata?.units);
  // Un member sin units cae a landing-pages: era el único acceso posible antes
  // de que este campo existiera.
  const unidades = declaradas.length > 0 ? declaradas : ["landing-pages" as const];

  if (puedeVerRuta(esOwner, unidades, req.nextUrl.pathname)) return;

  const destino = rutaInicial(esOwner, unidades);
  if (req.nextUrl.pathname === destino) return;
  return NextResponse.redirect(new URL(destino, req.url));
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
