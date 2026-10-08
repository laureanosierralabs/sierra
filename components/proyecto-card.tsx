import Link from "next/link";
import { ArrowAngularTopRight, InfoTriangle } from "@tailgrids/icons";
import { Card } from "@/components/tailgrids/core/card";
import { Deadline, EstadoPill, PrioridadTag } from "@/components/ui";
import { diasHasta, type Proyecto } from "@/lib/types";

export function ProyectoCard({ p }: { p: Proyecto }) {
  const dias = diasHasta(p.entrega);
  const tieneBloqueos = p.bloqueos.length > 0;

  return (
    <Link
      href={`/proyecto/${p.slug}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Card className="flex h-full flex-col gap-4 transition-colors group-hover:border-primary-300">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-title-50">{p.nombre}</h3>
            <p className="mt-0.5 truncate text-xs text-text-tertiary">{p.cliente}</p>
          </div>
          <ArrowAngularTopRight
            aria-hidden="true"
            className="size-4 shrink-0 text-text-tertiary transition-colors group-hover:text-text-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EstadoPill estado={p.estado} />
          <PrioridadTag prioridad={p.prioridad} />
          {dias !== null && <Deadline dias={dias} />}
        </div>

        <div className="border-t border-card-border pt-3">
          {p.proximoPaso ? (
            <>
              <p className="mb-1 text-xs font-medium text-text-tertiary">Próximo paso</p>
              <p className="line-clamp-2 text-sm text-text-secondary">{p.proximoPaso}</p>
            </>
          ) : (
            <p className="text-sm text-text-tertiary">Sin próximo paso definido</p>
          )}
        </div>

        {tieneBloqueos && (
          <div className="flex items-start gap-2 rounded-lg bg-badge-error-background px-3 py-2 text-badge-error-text">
            <InfoTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <p className="line-clamp-2 text-xs">{p.bloqueos[0]}</p>
          </div>
        )}
      </Card>
    </Link>
  );
}
