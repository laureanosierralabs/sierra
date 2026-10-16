/**
 * Página de login.
 *
 * Usa el componente PRE-ARMADO `<SignIn>` de Clerk (no headless): maneja
 * login por contraseña, "olvidé mi contraseña" y verificación de dispositivo
 * de forma nativa y segura. La pantalla cambia de texto si entra un cliente
 * (a su portal) o alguien del equipo (al panel).
 */

import { SignIn } from "@clerk/nextjs";
import { APARIENCIA_CLERK, PantallaIngreso } from "@/components/auth/pantalla-ingreso";
import { audienciaDe } from "@/lib/audiencia-ingreso";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const audiencia = audienciaDe(await searchParams);
  const cliente = audiencia === "cliente";

  return (
    <PantallaIngreso
      audiencia={audiencia}
      encabezado={cliente ? "Ingresá a tu portal" : "Iniciá sesión"}
      subtitulo={cliente ? "Con el email al que te llegó la invitación." : "Entrá con tu cuenta del equipo."}
    >
      <SignIn fallbackRedirectUrl={cliente ? "/portal" : "/"} appearance={APARIENCIA_CLERK} />
    </PantallaIngreso>
  );
}
