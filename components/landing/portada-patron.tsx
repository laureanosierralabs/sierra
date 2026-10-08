import { GrillaPuntos } from "@/components/landing/grilla-puntos";
import { cn } from "@/utils/cn";

/**
 * Portada del proyecto: mismo patrón para todos. Grilla de puntos que brillan
 * sobre un azul profundo (familia primary del template), con el nombre encima.
 *
 * Un patrón compartido hace que la lista se lea como un sistema. Con portadas
 * sueltas cada proyecto tira para su lado y el tablero se vuelve ruido.
 *
 * Es siempre oscura, también en el tema claro: los puntos y el texto claro
 * dependen de ese fondo.
 */
export function PortadaPatron({
  titulo,
  alto = "h-28",
}: {
  /** Nombre de la empresa o del proyecto. */
  titulo: string;
  alto?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden border-b border-card-border bg-linear-to-br from-primary-950 via-primary-900 to-primary-800 px-4",
        alto,
      )}
    >
      <GrillaPuntos />

      {/* Halos difusos sobre la grilla: los puntos dan textura, esto da profundidad.
          Elipses más anchas que altas porque la franja es baja. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-[ellipse_50%_220%_at_12%_50%] from-primary-300/30 to-transparent to-70% blur-lg"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-[ellipse_45%_190%_at_75%_55%] from-primary-400/25 to-transparent to-68% blur-lg"
      />

      {/* Velo detrás del texto para que el brillo no le coma el contraste. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary-950/10 to-primary-950/55"
      />

      <p className="relative z-10 line-clamp-2 text-center text-sm font-bold tracking-wide text-white-90 uppercase">
        {titulo}
      </p>
    </div>
  );
}
