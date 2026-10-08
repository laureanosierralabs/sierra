import Link from "next/link";
import { InfoTriangle } from "@tailgrids/icons";
import { Card } from "@/components/tailgrids/core/card";
import { Deadline } from "@/components/ui";
import { diasHasta, type Proyecto } from "@/lib/types";
import { cn } from "@/utils/cn";

/** Fila de "Necesita atención": proyecto, próximo paso, bloqueos y vencimiento. */
export function InicioAtencion({ p }: { p: Proyecto }) {
  const dias = diasHasta(p.entrega);
  const urgente = dias !== null && dias <= 10;

  return (
    <Link
      href={`/proyecto/${p.slug}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Card
        className={cn(
          "transition-colors group-hover:border-primary-300",
          urgente && "border-l-2 border-l-warning-500",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-semibold text-title-50">{p.nombre}</h3>
              <span className="text-xs text-text-tertiary">{p.cliente}</span>
            </div>
            {p.proximoPaso && (
              <p className="mt-2 text-sm text-text-secondary">{p.proximoPaso}</p>
            )}
            {p.bloqueos.length > 0 && (
              <div className="mt-3 flex items-start gap-2 text-badge-error-text">
                <InfoTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <p className="text-xs">{p.bloqueos.join(" · ")}</p>
              </div>
            )}
          </div>
          {dias !== null && <Deadline dias={dias} />}
        </div>
      </Card>
    </Link>
  );
}
