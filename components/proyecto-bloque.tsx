import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

type IconoComponent = React.ComponentType<{ className?: string }>;

/** Bloque titulado de la ficha de proyecto. */
export function ProyectoBloque({
  titulo,
  icono: Icono,
  className,
  tituloClassName,
  children,
}: {
  titulo: string;
  icono?: IconoComponent;
  className?: string;
  tituloClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <h2
        className={cn(
          "mb-3 flex items-center gap-2 text-sm font-semibold text-title-50",
          tituloClassName,
        )}
      >
        {Icono && <Icono className="size-4 text-text-tertiary" />}
        {titulo}
      </h2>
      {children}
    </Card>
  );
}

/** Lista con borde lateral para decisiones y bitácora. */
export function ProyectoLinea({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((t, i) => (
        <li key={i} className="border-l-2 border-card-border pl-3 text-sm text-text-secondary">
          {t}
        </li>
      ))}
    </ul>
  );
}
