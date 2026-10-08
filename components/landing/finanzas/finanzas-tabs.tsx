import Link from "next/link";
import { VISTAS, hrefFinanzas, type ParamsFinanzas, type Vista } from "@/components/landing/finanzas/vistas";
import { cn } from "@/utils/cn";

/** Pestañas por URL (`?vista=`): sobreviven al refresh y conservan mes y moneda. */
export function FinanzasTabs({
  actual,
  mes,
  moneda,
}: { actual: Vista } & Pick<ParamsFinanzas, "mes" | "moneda">) {
  return (
    <nav
      aria-label="Secciones de finanzas"
      className="mb-6 overflow-x-auto border-b border-card-border"
    >
      <ul className="flex gap-2">
        {VISTAS.map((v) => {
          const activa = v.id === actual;
          return (
            <li key={v.id}>
              <Link
                href={hrefFinanzas({ vista: v.id, mes: v.id === "resumen" ? mes : undefined, moneda })}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center border-b-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                  activa
                    ? "border-primary-500 text-neutral-brand-color"
                    : "border-transparent text-text-100 hover:text-neutral-brand-color",
                )}
              >
                {v.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
