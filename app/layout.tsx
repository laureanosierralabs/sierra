import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
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
            {esAuth ? (
              children
            ) : (
              <div className="flex min-h-screen">
                {/* El sidebar es sticky al viewport: no crece con el contenido */}
                <div className="sticky top-0 hidden h-screen shrink-0 md:block">
                  <Sidebar />
                </div>
                <main className="min-w-0 flex-1">{children}</main>
              </div>
            )}
          </ClerkProvider>
        </Providers>
      </body>
    </html>
  );
}
