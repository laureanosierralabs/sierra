import { cn } from "@/utils/cn";
import { primerasLineas, tipoPreview, type ComponenteUI } from "@/lib/componentes/tipos";

type Datos = Pick<ComponenteUI, "title" | "code" | "code_language" | "preview_url">;

/**
 * Vista previa de un componente. Prioridad: imagen o video pegado; si el
 * código es HTML, un iframe aislado; si no, las primeras líneas del código.
 *
 * Seguridad: el código pegado NUNCA se inserta como HTML en la página. El único
 * lugar donde se interpreta es el iframe con `sandbox=""` (sin scripts, sin
 * formularios, sin mismo origen); en todos los demás casos React lo escapa.
 */
export function VistaPrevia({
  componente,
  grande = false,
  className,
}: {
  componente: Datos;
  /** Detalle: más alto y con controles de video. */
  grande?: boolean;
  className?: string;
}) {
  const alto = grande ? "h-80 sm:h-[28rem]" : "h-40";
  const marco = cn("w-full overflow-hidden bg-base-50", alto, className);

  if (componente.preview_url) {
    if (tipoPreview(componente.preview_url) === "video") {
      return (
        <div className={marco}>
          <video
            src={componente.preview_url}
            muted
            loop
            playsInline
            preload="metadata"
            controls={grande}
            autoPlay={!grande}
            aria-label={`Vista previa de ${componente.title}`}
            className="size-full object-cover"
          />
        </div>
      );
    }
    return (
      <div className={marco}>
        {/* eslint-disable-next-line @next/next/no-img-element -- capturas de cualquier dominio */}
        <img
          src={componente.preview_url}
          alt={`Vista previa de ${componente.title}`}
          loading="lazy"
          className={cn("size-full", grande ? "object-contain" : "object-cover object-top")}
        />
      </div>
    );
  }

  if (componente.code_language === "html" && componente.code) {
    return (
      <div className={cn(marco, "relative")}>
        <iframe
          title={`Vista previa de ${componente.title}`}
          srcDoc={componente.code}
          sandbox=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className={cn("absolute top-0 left-0 border-0 bg-white", grande ? "size-full" : "h-[200%] w-[200%] origin-top-left scale-50")}
        />
        {/* En la tarjeta el iframe no captura clics: la tarjeta entera lleva al detalle. */}
        {!grande && <div aria-hidden className="absolute inset-0" />}
      </div>
    );
  }

  if (componente.code) {
    return (
      <div className={cn(marco, "px-4 py-3")}>
        <pre className="font-mono text-[0.6875rem] leading-4 whitespace-pre text-text-secondary">
          {primerasLineas(componente.code, grande ? 24 : 8)}
        </pre>
      </div>
    );
  }

  return (
    <div className={cn(marco, "flex items-center justify-center text-xs text-text-tertiary")}>Sin vista previa</div>
  );
}
