import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema Operativo",
  description: "Centro de operaciones",
};

/**
 * Aplica el tema guardado antes del primer paint. Sin esto, quien tenga el
 * tema oscuro forzado ve un flash blanco en cada carga.
 */
const TEMA_INICIAL = `
try {
  var t = localStorage.getItem('tema');
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${inter.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body className="min-h-full">
        <ClerkProvider>
          <div className="flex min-h-screen">
            {/* El sidebar es sticky al viewport: no crece con el contenido */}
            <div className="sticky top-0 hidden h-screen shrink-0 md:block">
              <Sidebar />
            </div>
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
