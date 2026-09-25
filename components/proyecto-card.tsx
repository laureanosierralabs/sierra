import Link from "next/link";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { Card, EstadoPill, PrioridadTag, Deadline } from "@/components/ui";
import { diasHasta, type Proyecto } from "@/lib/types";

export function ProyectoCard({ p }: { p: Proyecto }) {
  const dias = diasHasta(p.entrega);
  const tieneBloqueos = p.bloqueos.length > 0;

  return (
    <Link href={`/proyecto/${p.slug}`} className="group block">
      <Card className="h-full p-5 transition-colors hover:border-line-strong">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[0.9375rem] font-bold text-text">
              {p.nombre}
            </h3>
            <p className="mt-0.5 truncate text-xs text-text-3">{p.cliente}</p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-text-3 transition-colors group-hover:text-text" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <EstadoPill estado={p.estado} />
          <PrioridadTag prioridad={p.prioridad} />
          {dias !== null && <Deadline dias={dias} />}
        </div>

        {p.proximoPaso ? (
          <div className="mt-4 border-t border-line pt-3">
            <p className="eyebrow mb-1">Próximo paso</p>
            <p className="line-clamp-2 text-sm text-text-2">{p.proximoPaso}</p>
          </div>
        ) : (
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-sm text-text-3">Sin próximo paso definido</p>
          </div>
        )}

        {tieneBloqueos && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-critical-dim px-3 py-2">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-critical" />
            <p className="line-clamp-2 text-xs text-critical">{p.bloqueos[0]}</p>
          </div>
        )}
      </Card>
    </Link>
  );
}
