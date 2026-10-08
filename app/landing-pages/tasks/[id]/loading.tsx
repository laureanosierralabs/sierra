import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que el detalle: volver, título con acciones, propiedades y adjuntos.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando tarea">
      <Skeleton className="mb-4 h-4 w-28" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-72 max-w-full rounded-md" />
        <Skeleton className="h-5 w-12" />
      </div>

      <Card className="mb-6 grid gap-x-10 gap-y-3 px-4 py-3 md:grid-cols-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <Skeleton className="h-3.5 w-24 shrink-0" />
            <Skeleton className="h-6 w-32 rounded-md" />
          </div>
        ))}
      </Card>

      <Card className="mb-6 flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </Card>

      <Skeleton className="mb-3 h-4 w-24" />
      <Card className="p-3">
        <Skeleton className="h-8 w-40 rounded-lg" />
      </Card>
    </div>
  );
}
