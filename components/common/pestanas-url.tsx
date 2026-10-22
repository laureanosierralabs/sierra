import Link from "next/link";
import { cn } from "@/utils/cn";

/**
 * Pestañas por URL (`?vista=`): sobreviven al refresh y se pueden compartir.
 * Mismo aspecto que las de Finanzas.
 */
export function PestanasUrl({
  etiqueta,
  actual,
  pestanas,
}: {
  etiqueta: string;
  actual: string;
  pestanas: { id: string; label: string; href: string; cantidad?: number }[];
}) {
  return (
    <nav aria-label={etiqueta} className="mb-6 overflow-x-auto border-b border-card-border">
      <ul className="flex gap-2">
        {pestanas.map((p) => {
          const activa = p.id === actual;
          return (
            <li key={p.id}>
              <Link
                href={p.href}
                scroll={false}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                  activa
                    ? "border-primary-500 text-neutral-brand-color"
                    : "border-transparent text-text-100 hover:text-neutral-brand-color",
                )}
              >
                {p.label}
                {p.cantidad !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums",
                      activa ? "bg-primary-500/15 text-primary-500" : "bg-background-gray-secondary text-text-tertiary",
                    )}
                  >
                    {p.cantidad}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
