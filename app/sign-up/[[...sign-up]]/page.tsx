/**
 * Crear la cuenta. Solo se llega con una invitación (el registro abierto está
 * cerrado en Clerk): el componente lee el ticket de la URL y acepta la
 * invitación. Misma pantalla que el login, con el texto según quién entra.
 */

import { SignUp } from "@clerk/nextjs";
import { APARIENCIA_CLERK, PantallaIngreso } from "@/components/auth/pantalla-ingreso";
import { headers } from "next/headers";
import { audienciaDe } from "@/lib/audiencia-ingreso";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const audiencia = audienciaDe(await searchParams, (await headers()).get("host"));
  const cliente = audiencia === "cliente";

  return (
    <PantallaIngreso
      audiencia={audiencia}
      encabezado={cliente ? "Activa tu acceso" : "Creá tu cuenta"}
      subtitulo={
        cliente
          ? "Elige una contraseña para ver tus lanzamientos."
          : "Completá tus datos para entrar al panel del equipo."
      }
    >
      <SignUp fallbackRedirectUrl={cliente ? "/portal" : "/"} appearance={APARIENCIA_CLERK} />
    </PantallaIngreso>
  );
}
