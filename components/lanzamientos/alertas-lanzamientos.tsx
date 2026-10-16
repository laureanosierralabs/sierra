import Link from "next/link";
import { InfoOctagon, InfoTriangle } from "@tailgrids/icons";
import { Card } from "@/components/tailgrids/core/card";
import type { Alerta } from "@/lib/lanzamientos/alertas";
import { cn } from "@/utils/cn";

/**
 * Lo que se rompió en un lanzamiento activo y nadie vio. Solo aparece si hay
 * algo: un inicio sin alertas es la buena noticia.
 */
export function AlertasLanzamientos({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) return null;
  return (
    <Card className="mb-8 overflow-hidden p-0">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="text-base font-semibold text-text-primary">Lanzamientos que necesitan atención</h2>
        <p className="text-sm text-text-tertiary">Se revisa cada vez que abrís el panel</p>
      </div>
      <ul className="divide-y divide-card-border">
        {alertas.map((a) => (
          <li key={a.id}>
            <Link
              href={`/landing-pages/launches/${a.lanzamiento.id}`}
              className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-background-gray-secondary"
            >
              <span
                className={cn(
                  "mt-0.5 shrink-0 [&>svg]:size-4",
                  a.gravedad === "error" ? "text-badge-error-text" : "text-badge-warning-text",
                )}
              >
                {a.gravedad === "error" ? <InfoOctagon /> : <InfoTriangle />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-primary">{a.titulo}</span>
                <span className="block text-xs text-text-tertiary">
                  {a.lanzamiento.cliente} · {a.lanzamiento.name}
                </span>
                <span className="mt-0.5 block text-sm text-text-secondary">{a.detalle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
