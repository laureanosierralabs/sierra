import Link from "next/link";
import { cn } from "@/utils/cn";
import { VISTAS, type FinanceQuery, type Vista } from "../tipos";
import { vistaHref } from "../url";

/**
 * Selector de vista dirigido por la URL (`?vista=`). Usa links reales: cada vista
 * se puede abrir, recargar y compartir. Mismo aspecto que las Tabs del template.
 */
export function VistaTabs({ vista, query }: { vista: Vista; query: FinanceQuery }) {
  return (
    <nav aria-label="Secciones de finanzas" className="mb-6 max-w-full overflow-x-auto">
      <div className="inline-flex gap-1 rounded-lg bg-background-gray-secondary p-1">
        {VISTAS.map((item) => (
          <Link
            key={item.value}
            href={vistaHref(query, item.value)}
            aria-current={item.value === vista ? "page" : undefined}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              item.value === vista
                ? "bg-tab-active-background text-title-50 shadow-xs"
                : "text-text-100 hover:text-title-50",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
