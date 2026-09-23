import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { parsearUnidades, puedeVerRuta, rutaInicial } from "@/lib/unidades";

const esPublica = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/sin-acceso"]);

export default clerkMiddleware(async (auth, req) => {
  if (esPublica(req)) return;

  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  // El token de sesión de Core 3 no incluye publicMetadata, así que el rol se
  // lee del usuario. Verificado: los claims solo traen azp/exp/iss/sid/sub/v.
  const cliente = await clerkClient();
  const usuario = await cliente.users.getUser(userId);
  const metadata = usuario.publicMetadata as
    | { role?: unknown; units?: unknown }
    | undefined;

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
