import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la ficha: volver, título con acciones, propiedades y secciones.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando cliente">
      <Skeleton className="mb-4 h-4 w-20" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64 max-w-full rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="flex flex-col gap-8">
        <Card className="px-5 py-3">
          <div className="grid gap-x-10 gap-y-3 md:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <Skeleton className="h-3.5 w-24 shrink-0" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </Card>

        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <Skeleton className="mb-3 h-4 w-44" />
            <Card className="overflow-hidden p-0">
              {Array.from({ length: 2 }, (_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between gap-3 border-b border-card-border px-4 py-3 last:border-0"
                >
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
