import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { UserProfileButton } from "@/components/common/header/user-profile";

export const metadata: Metadata = {
  title: "Portal de clientes · sierra labs",
  robots: { index: false, follow: false },
};

/**
 * Layout propio del portal: sin el panel interno (el RootLayout lo excluye
 * por ruta). Solo la marca y la cuenta del usuario.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background-gray-secondary print:bg-white">
      <header className="border-b border-card-border bg-card-background print:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/portal" aria-label="Inicio del portal">
            <Image
              src="/logotipo-azul.png"
              alt="sierra labs · web design"
              width={320}
              height={85}
              priority
              className="h-auto w-36"
            />
          </Link>
          <UserProfileButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
