import { GrillaPuntos } from "@/components/landing/grilla-puntos";

/**
 * Portada del proyecto: mismo patrón para todos. Grilla de puntos que brillan
 * sobre un azul profundo, con el nombre del cliente encima.
 *
 * Un patrón compartido hace que la lista se lea como un sistema. Con portadas
 * sueltas cada proyecto tira para su lado y el tablero se vuelve ruido.
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
      className={`relative isolate flex ${alto} items-center justify-center overflow-hidden border-b border-line px-4`}
      style={{
        background:
          "linear-gradient(135deg, #060a18 0%, #0a1330 45%, #0d1b47 100%)",
      }}
    >
      <GrillaPuntos />

      {/* Halo difuso sobre la grilla: los puntos dan textura, esto da profundidad.
          Elipses más anchas que altas porque la franja es baja. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 220% at 12% 50%, rgba(150,192,255,0.28), transparent 70%)," +
            "radial-gradient(ellipse 45% 190% at 75% 55%, rgba(77,131,255,0.22), transparent 68%)",
          filter: "blur(18px)",
        }}
      />

      {/* Velo detrás del texto para que el brillo no le coma el contraste. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,10,24,0.1) 0%, rgba(6,10,24,0.55) 100%)",
        }}
      />

      <p className="relative z-10 line-clamp-2 text-center font-display text-sm font-bold uppercase tracking-wide text-white/90">
        {titulo}
      </p>
    </div>
  );
}
