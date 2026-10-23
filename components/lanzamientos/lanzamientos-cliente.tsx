import Link from "next/link";
import { Rocket1 } from "@tailgrids/icons";
import { LanzamientoForm } from "@/components/lanzamientos/lanzamiento-gestion";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { fechaCorta } from "@/lib/landing/tipos";
import type { LanzamientoConTotal } from "@/lib/lanzamientos/datos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";

function TarjetaLanzamiento({ l }: { l: LanzamientoConTotal }) {
  const imagen = l.banner_url ?? l.cover_url;
  const fechas = l.starts_on ? `${fechaCorta(l.starts_on)}${l.ends_on ? ` → ${fechaCorta(l.ends_on)}` : ""}` : null;
  // Un lanzamiento de venta se mide en ventas; uno de registro, en registros.
  const avance =
    !l.deVenta && l.goal_registrations ? Math.min(100, Math.round((l.registros / l.goal_registrations) * 100)) : null;
  const cifra = l.deVenta ? l.ventas : l.registros;

  return (
    <Link href={`/landing-pages/launches/${l.id}`} className="group outline-none">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary-500">
        <div className="relative aspect-8/3 overflow-hidden bg-primary-500/10">
          {imagen ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagen del bucket público de portadas
            <img src={imagen} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <span aria-hidden="true" className="flex h-full items-center justify-center text-primary-500/50 [&>svg]:size-8">
              <Rocket1 />
            </span>
          )}
          <Badge
            color={l.status === "activo" ? "success" : "gray"}
            size="sm"
            className="absolute top-3 left-3"
          >
            {LABEL_ESTADO_LANZAMIENTO[l.status]}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-title-50">{l.name}</p>
            {fechas && <p className="text-xs text-text-tertiary">{fechas}</p>}
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl font-semibold text-text-primary tabular-nums">
                {cifra.toLocaleString("es-AR")}
              </span>
              <span className="text-xs text-text-tertiary">
                {avance !== null
                  ? `${avance}% de ${l.goal_registrations?.toLocaleString("es-AR")}`
                  : l.deVenta
                    ? "ventas medidas"
                    : "registros"}
              </span>
            </div>
            {avance !== null && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-gray-secondary">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${avance}%` }} />
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-primary-500">Ver resultados y configuración →</span>
        </div>
      </Card>
    </Link>
  );
}

/** Lanzamientos del cliente en su ficha, como tarjetas (solo owner). */
export function LanzamientosCliente({
  clientId,
  lanzamientos,
}: {
  clientId: string;
  lanzamientos: LanzamientoConTotal[];
}) {
  return (
    <section aria-label="Lanzamientos">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-title-50">Lanzamientos</h2>
        <span className="text-xs text-text-tertiary tabular-nums">{lanzamientos.length}</span>
        <span className="ml-auto">
          <LanzamientoForm clientId={clientId} />
        </span>
      </div>
      {lanzamientos.length === 0 ? (
        <Card className="py-8 text-center text-sm text-text-tertiary">Todavía no hay lanzamientos.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lanzamientos.map((l) => (
            <TarjetaLanzamiento key={l.id} l={l} />
          ))}
        </div>
      )}
    </section>
  );
}
