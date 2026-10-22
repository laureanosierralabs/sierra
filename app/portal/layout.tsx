import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { UserProfileButton } from "@/components/common/header/user-profile";
import { portalesDisponibles } from "@/lib/portal/contexto";
import "./portal.css";

export const metadata: Metadata = {
  title: "Portal de clientes · sierra labs",
  robots: { index: false, follow: false },
};

/* La tipografía de la marca (la de laureanosierra.com y el login del panel). */
const marca = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-portal",
});

/**
 * Layout propio del portal: sin el panel interno (el RootLayout lo excluye
 * por ruta). Siempre oscuro (lo fuerza app/providers.tsx para /portal).
 *
 * El encabezado flota arriba, transparente: en las pantallas con banda de
 * portada (inicio y lanzamiento) queda DENTRO de la banda, como en una
 * presentación; en las demás, sobre el fondo. Los documentos (reporte de
 * cierre) usan sus propios colores de papel, así que no se oscurecen.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Quien opera varias marcas ve "Cambiar de marca"; si falla, simplemente no aparece.
  const variasMarcas = (await portalesDisponibles().catch(() => [])).length > 1;

  return (
    <div
      className={`${marca.variable} portal-raiz relative flex min-h-screen flex-col overflow-x-clip bg-neutral-950 font-(family-name:--font-portal) text-white print:bg-white`}
    >
      <header className="absolute inset-x-0 top-0 z-30 print:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Link href="/portal" aria-label="Inicio del portal" className="group flex items-center gap-3">
            <Image
              src="/logotipo-blanco.png"
              alt="sierra labs · web design"
              width={320}
              height={85}
              priority
              className="h-auto w-32 drop-shadow"
            />
            <span className="hidden text-sm font-extrabold tracking-wide text-primary-300 uppercase transition-colors group-hover:text-primary-200 sm:inline">
              Portal <span className="text-white">de clientes</span>
            </span>
          </Link>
          <span className="flex items-center gap-4">
            {variasMarcas && (
              <Link
                href="/portal"
                className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
              >
                Cambiar de marca
              </Link>
            )}
            <UserProfileButton />
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-20 sm:px-6 print:max-w-none print:p-0">{children}</main>
      <footer className="pb-10 text-center text-xs leading-relaxed font-medium text-white/60 print:hidden">
        Todos los derechos reservados
        <br />
        sierra labs {new Date().getFullYear()}®
      </footer>
    </div>
  );
}
