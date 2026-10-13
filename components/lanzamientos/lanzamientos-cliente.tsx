import Link from "next/link";
import { SeccionCard } from "@/components/landing/seccion-card";
import { LanzamientoForm } from "@/components/lanzamientos/lanzamiento-gestion";
import { Badge } from "@/components/tailgrids/core/badge";
import type { LanzamientoConTotal } from "@/lib/lanzamientos/datos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";

/** Lanzamientos del cliente en su ficha (solo owner). */
export function LanzamientosCliente({
  clientId,
  lanzamientos,
}: {
  clientId: string;
  lanzamientos: LanzamientoConTotal[];
}) {
  return (
    <SeccionCard titulo="Lanzamientos" cantidad={lanzamientos.length}>
      {lanzamientos.map((l) => (
        <Link
          key={l.id}
          href={`/landing-pages/launches/${l.id}`}
          className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-background-gray-secondary"
        >
          <span className="min-w-0 truncate text-sm text-text-primary">{l.name}</span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="text-sm tabular-nums text-text-secondary">
              {l.registros.toLocaleString("es-AR")} registros
            </span>
            <Badge color={l.status === "activo" ? "success" : "gray"} size="sm">
              {LABEL_ESTADO_LANZAMIENTO[l.status]}
            </Badge>
          </span>
        </Link>
      ))}
      <div className="px-4 py-3">
        <LanzamientoForm clientId={clientId} />
      </div>
    </SeccionCard>
  );
}
