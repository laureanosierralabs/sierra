import Link from "next/link";
import { ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { cn } from "@/utils/cn";

/**
 * Títulos grandes del portal: la condensada que carga su layout. Con `!`
 * porque la regla global de h1/h2/h3 (sin capa) le gana a cualquier utilidad.
 */
export const DISPLAY = "font-(family-name:--font-portal)! uppercase tracking-tight";

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
    <section id={id} className="portal-revelar scroll-mt-8">
      <div className="mb-6 flex items-center gap-4">
        <h2 className="shrink-0 font-sans! text-base font-semibold text-white">{titulo}</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-linear-to-r from-white/25 to-white/5" />
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
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px] shadow-primary-500/70 transition-all hover:-translate-y-0.5 hover:bg-primary-400 [&>svg]:size-3.5 [&>svg]:transition-transform group-hover:[&>svg]:translate-x-0.5"
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
    <section className="relative -mt-28 mb-16 ml-[calc(50%-50vw)] w-screen">
      <div className={cn("relative overflow-hidden", imagen ? "bg-neutral-900" : "bg-[#444446]")}>
        {imagen && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen subida al bucket público de portadas */}
            <img src={imagen} alt="" className="portal-zoom absolute inset-0 h-full w-full object-cover" />
            {/* Arriba se oscurece para que el encabezado se lea; abajo se funde con el fondo. */}
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-black/60 via-black/15 to-neutral-950/95" />
          </>
        )}
        <div className={cn("relative mx-auto flex max-w-6xl flex-col px-4 pt-36 sm:px-6", solapa ? "pb-24" : "pb-28")}>
          <h1
            className={cn(
              DISPLAY,
              "portal-titulo text-center text-[clamp(3.25rem,11vw,9rem)] leading-[0.85]",
              imagen ? "text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]" : "text-[#2e2e30]",
            )}
          >
            {titulo}
          </h1>
          {subtitulo && (
            <p className="portal-entrar mt-5 text-center text-sm font-medium text-white/80" style={{ "--retraso": "0.35s" } as React.CSSProperties}>
              {subtitulo}
            </p>
          )}
          {etiqueta && <p className="mt-16 text-base font-semibold text-white sm:mt-20">{etiqueta}</p>}
        </div>
      </div>

      {solapa && <div className="relative mx-auto -mt-16 max-w-6xl px-4 sm:px-6">{solapa}</div>}

      {anclaAbajo && !solapa && (
        <a
          href={anclaAbajo}
          aria-label="Bajar al contenido"
          className="absolute bottom-0 left-1/2 flex size-16 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-neutral-950 outline-none focus-visible:ring-4 focus-visible:ring-primary-500/40"
        >
          <span className="portal-rebote flex size-9 items-center justify-center rounded-full bg-white/10 text-lg text-primary-300 ring-1 ring-white/15 transition-colors hover:bg-primary-500 hover:text-white">
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
 * Entra escalonada (`indice`) y al pasar se eleva con un brillo azul.
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
      style={{ "--retraso": `${0.25 + indice * 0.09}s` } as React.CSSProperties}
      className={cn(
        "portal-entrar group relative flex aspect-9/16 flex-col justify-end overflow-hidden rounded-[28px] outline-none",
        "shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)] transition-[transform,box-shadow] duration-500 ease-out",
        "hover:-translate-y-2 hover:shadow-[0_28px_60px_-18px] hover:shadow-primary-500/45 focus-visible:-translate-y-2 focus-visible:ring-4 focus-visible:ring-primary-500/50",
        imagen ? "bg-neutral-800" : "bg-[#d9d9d9]",
      )}
    >
      {imagen ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen subida al bucket público de portadas */}
          <img
            src={imagen}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
        </>
      ) : (
        <span
          aria-hidden="true"
          className={cn(DISPLAY, "absolute inset-x-0 top-[22%] px-7 text-[clamp(2.5rem,5vw,4rem)] leading-[0.9] break-words text-[#b9b9b9]")}
        >
          {nombre}
        </span>
      )}

      <span className="relative flex flex-col gap-1.5 p-6 transition-transform duration-500 group-hover:-translate-y-1">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase backdrop-blur",
            imagen ? "bg-white/15 text-white" : "bg-black/10 text-neutral-700",
          )}
        >
          {activo && (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
          )}
          {estado}
        </span>
        <span className={cn("text-lg leading-tight font-semibold", imagen ? "text-white" : "text-neutral-900")}>{nombre}</span>
        <span className={cn("text-xs", imagen ? "text-white/70" : "text-neutral-600")}>
          {[fechas, detalle].filter(Boolean).join(" · ")}
        </span>
        <span
          className={cn(
            "mt-1 max-h-0 overflow-hidden text-sm font-semibold opacity-0 transition-all duration-500 group-hover:max-h-6 group-hover:opacity-100",
            imagen ? "text-primary-300" : "text-primary-600",
          )}
        >
          Ver lanzamiento →
        </span>
      </span>
    </Link>
  );
}
