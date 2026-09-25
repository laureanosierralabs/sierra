/**
 * Diagnóstico de producción. Reporta si las variables de entorno están
 * presentes y de qué tipo son — nunca sus valores.
 *
 * Pública a propósito: sirve justamente cuando el login no funciona.
 */
export const dynamic = "force-dynamic";

function estado(v: string | undefined): string {
  if (!v) return "FALTA";
  return `ok (${v.length} chars)`;
}

export async function GET() {
  const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSk = process.env.CLERK_SECRET_KEY;

  return Response.json({
    ok: true,
    entorno: process.env.VERCEL_ENV ?? "local",
    variables: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: estado(clerkPk),
      CLERK_SECRET_KEY: estado(clerkSk),
      NEXT_PUBLIC_SUPABASE_URL: estado(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: estado(process.env.SUPABASE_SERVICE_ROLE_KEY),
      CREDENTIALS_KEY: estado(process.env.CREDENTIALS_KEY),
    },
    clerk: {
      // Las keys de Development no sirven en un dominio de producción.
      publishable: clerkPk?.startsWith("pk_live_")
        ? "live"
        : clerkPk?.startsWith("pk_test_")
          ? "test"
          : "desconocida",
      secret: clerkSk?.startsWith("sk_live_")
        ? "live"
        : clerkSk?.startsWith("sk_test_")
          ? "test"
          : "desconocida",
    },
  });
}
