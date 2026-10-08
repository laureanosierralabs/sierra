/**
 * Página de login del Sistema Operativo.
 *
 * Usa el componente PRE-ARMADO `<SignIn>` de Clerk (no headless): maneja
 * login por contraseña, "olvidé mi contraseña" y verificación de dispositivo
 * de forma nativa y segura. La marca y el layout viven en `AuthLayout`; la
 * apariencia de Clerk, con tokens, en `CLERK_APARIENCIA`.
 */

import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/auth-layout";
import { CLERK_APARIENCIA } from "@/components/auth/clerk-apariencia";

export default function SignInPage() {
  return (
    <AuthLayout titulo="Iniciá sesión" descripcion="Entrá con tu cuenta del equipo.">
      <SignIn fallbackRedirectUrl="/" appearance={CLERK_APARIENCIA} />
    </AuthLayout>
  );
}
