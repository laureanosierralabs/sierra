import Link from "next/link";
import { ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { cn } from "@/utils/cn";

/**
 * Títulos grandes del portal, con la tipografía de la marca que carga su
 * layout. Con `!` porque la regla global de h1/h2/h3 (sin capa) le gana a
 * cualquier utilidad.
 */
export const DISPLAY = "font-(family-name:--font-portal)! font-extrabold uppercase tracking-[-0.03em]";

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
    <section id={id} className="scroll-mt-8">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mb-6">
        <h2 className="min-w-0 text-lg font-bold tracking-tight text-white sm:text-xl">{titulo}</h2>
        <span aria-hidden="true" className="hidden h-px flex-1 bg-linear-to-r from-white/25 to-white/5 sm:block" />
        {accion && <div className="ml-auto shrink-0 sm:ml-0">{accion}</div>}
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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-400 [&>svg]:size-3.5"
    >
      {children}
      <ExpandArrowTopRightSquare1 />
    </a>
  );
}

/**
 * Banda de portada a todo el ancho, con el encabezado del layout adentro
 * (sube por debajo de él). Sin imagen, el título gigante en gris sobre gris,
 * como en las presentaciones. Debajo puede montarse contenido (`solapa`) que
 * pisa el borde entre la banda y el fondo, y una muesca con la flecha para
 * bajar (`anclaAbajo`).
 */
export function HeroPortal({
  imagen,
  titulo,
  subtitulo,
  etiqueta,
  solapa,
  anclaAbajo,
}: {
  imagen: string | null;
  titulo: string;
  subtitulo?: string;
  /** Rótulo al pie de la banda, sobre lo que se monta ("Lanzamientos"). */
  etiqueta?: string;
  solapa?: React.ReactNode;
  anclaAbajo?: string;
}) {
  return (
    <section className="relative -mt-28 mb-12 ml-[calc(50%-50vw)] w-screen sm:mb-16">
      <div className={cn("relative overflow-hidden", imagen ? "bg-neutral-900" : "bg-[#444446]")}>
        {imagen && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen subida al bucket público de portadas */}
            <img src={imagen} alt="" className="portal-zoom absolute inset-0 h-full w-full object-cover" />
            {/* Arriba se oscurece para que el encabezado se lea; abajo se funde con el fondo. */}
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-black/60 via-black/15 to-neutral-950/95" />
          </>
        )}
        <div
          className={cn(
            "relative mx-auto flex max-w-6xl flex-col px-4 pt-32 sm:px-6 sm:pt-40",
            solapa ? "pb-20 sm:pb-24" : "pb-24 sm:pb-32",
          )}
        >
          <h1
            className={cn(
              DISPLAY,
              "text-center text-[clamp(2.25rem,8vw,6.5rem)] leading-[0.95] text-balance break-words",
              imagen ? "text-white" : "text-[#2e2e30]",
            )}
          >
            {titulo}
          </h1>
          {subtitulo && (
            <p className={cn("mt-4 text-center text-sm font-medium sm:text-base", imagen ? "text-white/80" : "text-white/60")}>
              {subtitulo}
            </p>
          )}
          {etiqueta && <p className="mt-14 text-base font-bold text-white sm:mt-20 sm:text-lg">{etiqueta}</p>}
        </div>
      </div>

      {solapa && <div className="relative mx-auto -mt-12 max-w-6xl px-4 sm:-mt-16 sm:px-6">{solapa}</div>}

      {anclaAbajo && !solapa && (
        <a
          href={anclaAbajo}
          aria-label="Bajar al contenido"
          className="absolute bottom-0 left-1/2 flex size-14 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-neutral-950 outline-none focus-visible:ring-4 focus-visible:ring-primary-500/40 sm:size-16"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-primary-300 ring-1 ring-white/15 transition-colors hover:bg-primary-500 hover:text-white sm:size-9">
            ↓
          </span>
        </a>
      )}
    </section>
  );
}

/**
 * Tarjeta de un lanzamiento en el inicio: su flyer, alto, como un afiche.
 * Sin flyer, gris claro con el nombre fantasma, como en las presentaciones.
 * Entra escalonada (`indice`); al pasar, sube apenas.
 */
export function TarjetaLanzamiento({
  href,
  nombre,
  imagen,
  estado,
  activo,
  fechas,
  detalle,
  indice,
}: {
  href: string;
  nombre: string;
  imagen: string | null;
  estado: string;
  activo: boolean;
  fechas: string | null;
  detalle: string;
  indice: number;
}) {
  return (
    <Link
      href={href}
      style={{ "--retraso": `${0.15 + indice * 0.07}s` } as React.CSSProperties}
      className={cn(
        "portal-entrar group relative flex aspect-9/16 flex-col justify-end overflow-hidden rounded-3xl outline-none sm:rounded-[28px]",
        "shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)] ring-1 ring-white/5 transition-[transform,box-shadow] duration-300 ease-out",
        "hover:-translate-y-1 hover:ring-primary-500/40 focus-visible:ring-4 focus-visible:ring-primary-500/50",
        imagen ? "bg-neutral-800" : "bg-[#d9d9d9]",
      )}
    >
      {imagen ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen subida al bucket público de portadas */}
          <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-transparent" />
        </>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            DISPLAY,
            "absolute inset-x-0 top-[18%] px-4 text-[clamp(1.5rem,4.5vw,3rem)] leading-[0.95] break-words text-[#b9b9b9] sm:px-6",
          )}
        >
          {nombre}
        </span>
      )}

      <span className="relative flex flex-col gap-1 p-4 sm:gap-1.5 sm:p-6">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase sm:text-[11px]",
            imagen ? "bg-white/15 text-white backdrop-blur" : "bg-black/10 text-neutral-700",
          )}
        >
          {activo && <span className="size-1.5 rounded-full bg-emerald-400" />}
          {estado}
        </span>
        <span className={cn("text-base leading-tight font-bold sm:text-lg", imagen ? "text-white" : "text-neutral-900")}>{nombre}</span>
        <span className={cn("text-[11px] sm:text-xs", imagen ? "text-white/70" : "text-neutral-600")}>
          {[fechas, detalle].filter(Boolean).join(" · ")}
        </span>
        <span className={cn("mt-1 text-xs font-bold sm:text-sm", imagen ? "text-primary-300" : "text-primary-600")}>
          Ver lanzamiento <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </span>
    </Link>
  );
}
