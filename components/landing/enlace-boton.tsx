import { ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { cn } from "@/utils/cn";

/**
 * Enlace con aspecto de botón secundario. Es un `<a>` (no el Button de React
 * Aria) para poder usarlo en Server Components y para descargas.
 */
export function EnlaceBoton({
  href,
  icono,
  children,
  externo = false,
  descarga = false,
  titulo,
  className,
}: {
  href: string;
  icono?: React.ReactNode;
  children: React.ReactNode;
  /** Abre en otra pestaña y muestra el indicador de enlace externo. */
  externo?: boolean;
  descarga?: boolean;
  titulo?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      title={titulo}
      download={descarga || undefined}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-card-border bg-card-background px-3 py-2 text-sm font-medium text-text-secondary transition-colors outline-none hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4",
        className,
      )}
    >
      {icono}
      {children}
      {externo && <ExpandArrowTopRightSquare1 className="opacity-60" />}
    </a>
  );
}

/** Enlace chico de texto hacia afuera (teléfono, Instagram, propuesta). */
export function EnlaceExterno({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-w-0 items-center gap-1 hover:underline [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-text-tertiary",
        className,
      )}
    >
      {children}
      <ExpandArrowTopRightSquare1 />
    </a>
  );
}
