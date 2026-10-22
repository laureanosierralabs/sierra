import type { Metadata } from "next";
import { Anton } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { UserProfileButton } from "@/components/common/header/user-profile";

export const metadata: Metadata = {
  title: "Portal de clientes · sierra labs",
  robots: { index: false, follow: false },
};

/* Títulos grandes del portal, en una condensada como la de las presentaciones. */
const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-portal" });

/**
 * Layout propio del portal: sin el panel interno (el RootLayout lo excluye
 * por ruta). Siempre oscuro (lo fuerza app/providers.tsx para /portal), con
 * la marca arriba y la cuenta del usuario. Los documentos (reporte de cierre)
 * usan sus propios colores de papel, así que no se oscurecen.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} flex min-h-screen flex-col bg-neutral-950 text-text-primary print:bg-white`}
    >
      <header className="print:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/portal" aria-label="Inicio del portal" className="flex items-center gap-3">
            <Image
              src="/logotipo-blanco.png"
              alt="sierra labs · web design"
              width={320}
              height={85}
              priority
              className="h-auto w-32"
            />
            <span className="hidden font-[family-name:var(--font-portal)] text-lg tracking-tight text-primary-400 uppercase sm:inline">
              Portal de clientes
            </span>
          </Link>
          <UserProfileButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 print:max-w-none print:p-0">{children}</main>
      <footer className="py-8 text-center text-xs text-white/50 print:hidden">
        Todos los derechos reservados · sierra labs {new Date().getFullYear()}®
      </footer>
    </div>
  );
}
