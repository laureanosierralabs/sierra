import Image from "next/image";
import { GrillaPuntos } from "@/components/landing/grilla-puntos";

/**
 * Pantalla de acceso en dos columnas: marca a la izquierda (siempre oscura,
 * también en tema claro: la grilla y el texto claro dependen de ese fondo) y
 * el formulario a la derecha, sobre los tokens del tema. En pantallas chicas
 * la marca se reduce a una franja con el logo.
 */
export function AuthLayout({
  titulo,
  descripcion,
  children,
}: {
  /** Optional: omit it when the Clerk component shows its own step titles. */
  titulo?: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-background-gray-primary text-text-primary lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative isolate flex flex-col justify-between gap-12 overflow-hidden bg-linear-to-br from-primary-950 via-primary-900 to-primary-800 px-6 py-6 lg:p-12">
        <GrillaPuntos />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-radial-[ellipse_60%_50%_at_20%_0%] from-primary-300/30 to-transparent to-70% blur-lg"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary-950/10 to-primary-950/55"
        />

        <div className="relative z-10">
          <Image
            src="/logotipo-blanco.png"
            alt="Sistema Operativo"
            width={160}
            height={42}
            priority
            className="h-8 w-auto lg:h-10"
          />
        </div>

        <div className="relative z-10 hidden max-w-lg flex-col gap-4 lg:flex">
          <p className="w-fit rounded-full border border-primary-300/40 bg-primary-300/10 px-3 py-1 text-xs font-semibold tracking-wider text-white-90">
            LANDING PAGES
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-white-100">
            Cada proyecto, de punta a punta.
          </h1>
          <p className="text-base leading-relaxed text-white-80">
            Briefing, diseño, montaje y entrega. Todo el proceso en un solo lugar, para que nada se
            pierda entre herramientas.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          {titulo && (
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl leading-8 font-semibold tracking-[-0.2px] text-title-50">
                {titulo}
              </h2>
              {descripcion && <p className="text-sm text-text-secondary">{descripcion}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
