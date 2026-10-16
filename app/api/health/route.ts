/**
 * Diagnóstico de producción. Dice si las variables de entorno están
 * presentes y si Clerk está en modo producción — nunca valores, largos ni
 * detalles del entorno (una ruta pública no regala pistas a nadie).
 *
 * Pública a propósito: sirve justamente cuando el login no funciona.
 */
export const dynamic = "force-dynamic";

const presente = (v: string | undefined) => Boolean(v);

export async function GET() {
  const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSk = process.env.CLERK_SECRET_KEY;

  return Response.json({
    ok: true,
    variables: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: presente(clerkPk),
      CLERK_SECRET_KEY: presente(clerkSk),
      NEXT_PUBLIC_SUPABASE_URL: presente(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: presente(process.env.SUPABASE_SERVICE_ROLE_KEY),
      CREDENTIALS_KEY: presente(process.env.CREDENTIALS_KEY),
    },
    // Las keys de Development no sirven en un dominio de producción: es el
    // error más común cuando el login se rompe.
    clerkEnProduccion: Boolean(clerkPk?.startsWith("pk_live_") && clerkSk?.startsWith("sk_live_")),
  });
}
