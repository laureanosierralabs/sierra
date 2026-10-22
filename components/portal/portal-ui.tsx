import Link from "next/link";
import { ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { cn } from "@/utils/cn";

/** Títulos grandes del portal: la tipografía condensada que carga su layout. */
export const DISPLAY = "font-[family-name:var(--font-portal)] uppercase tracking-tight";

/** Sección del portal: título, una línea que la separa y una acción a la derecha. */
export function SeccionPortal({
  titulo,
  accion,
  id,
  children,
}: {
  titulo: string;
  accion?: React.ReactNode;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-5 flex items-center gap-4">
        <h2 className="shrink-0 text-base font-semibold text-text-primary">{titulo}</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-card-border" />
        {accion}
      </div>
      {children}
    </section>
  );
}

/** Botón píldora de acción ("Ver página"). */
export function PildoraEnlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 [&>svg]:size-3.5"
    >
      {children}
      <ExpandArrowTopRightSquare1 />
    </a>
  );
}

/**
 * Portada: la imagen que cargó el owner o, si no hay, el nombre en grande.
 * `anclaAbajo` suma la flecha que baja al contenido.
 */
export function HeroPortal({
  imagen,
  titulo,
  subtitulo,
  anclaAbajo,
}: {
  imagen: string | null;
  titulo: string;
  subtitulo?: string;
  anclaAbajo?: string;
}) {
  return (
    <div className="relative mb-12">
      <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-3xl bg-neutral-800 sm:min-h-72">
        {imagen ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen subida al bucket público de portadas */}
            <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        ) : null}
        <div className={cn("relative px-6 py-10 text-center", imagen && "self-end")}>
          <h1 className={cn(DISPLAY, "text-5xl leading-none text-white sm:text-7xl", !imagen && "text-white/90")}>{titulo}</h1>
          {subtitulo && <p className="mt-3 text-sm text-white/80">{subtitulo}</p>}
        </div>
      </div>
      {anclaAbajo && (
        <a
          href={anclaAbajo}
          aria-label="Bajar al contenido"
          className="absolute -bottom-5 left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-background-gray-secondary bg-neutral-900 text-primary-400 transition-transform hover:translate-y-0.5"
        >
          ↓
        </a>
      )}
    </div>
  );
}

/** Tarjeta de un lanzamiento en el inicio: su flyer, como en una grilla de proyectos realizados. */
export function TarjetaLanzamiento({
  href,
  nombre,
  imagen,
  estado,
  fechas,
  detalle,
}: {
  href: string;
  nombre: string;
  imagen: string | null;
  estado: string;
  fechas: string | null;
  detalle: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl bg-neutral-800 outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50"
    >
      {imagen ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagen subida al bucket público de portadas
        <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <span aria-hidden="true" className={cn(DISPLAY, "absolute inset-0 flex items-center px-6 text-5xl leading-[0.95] text-white/15")}>
          {nombre}
        </span>
      )}
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <span className="relative flex flex-col gap-1 p-5">
        <span className="self-start rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">{estado}</span>
        <span className="text-lg leading-tight font-semibold text-white">{nombre}</span>
        <span className="text-xs text-white/70">{[fechas, detalle].filter(Boolean).join(" · ")}</span>
      </span>
    </Link>
  );
}
