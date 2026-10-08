import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/common/app-shell";
import { accesoActual } from "@/lib/landing/auth";
import { DEFINICIONES } from "@/lib/unidades";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema Operativo",
  description: "Centro de operaciones",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Seteado por proxy.ts. Sin sesión el middleware ya redirige antes de
  // llegar acá, pero /sign-in y /sign-up son públicas: ahí no hay Sidebar
  // porque no hay usuario del que mostrar unidades ni rol.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const esAuth = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  const acceso = esAuth ? null : await accesoActual();
  // Un member con una sola unidad ve el nombre de esa unidad, no el del panel:
  // para él esto ES su panel.
  const soloUnidad =
    acceso && !acceso.esOwner && acceso.unidades.length === 1 ? acceso.unidades[0] : null;
  const titulo = soloUnidad ? DEFINICIONES[soloUnidad].nombre : "Sistema Operativo";

  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <Providers>
          {/* Sin esto Clerk redirige a su pantalla alojada en accounts.<dominio>
              en vez de usar /sign-in, que es la nuestra. */}
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
          >
            {acceso ? (
              <AppShell
                esOwner={acceso.esOwner}
                unidades={acceso.unidades}
                titulo={titulo}
                rolLabel={acceso.esOwner ? "Owner" : "Builder"}
              >
                {children}
              </AppShell>
            ) : (
              children
            )}
          </ClerkProvider>
        </Providers>
      </body>
    </html>
  );
}
