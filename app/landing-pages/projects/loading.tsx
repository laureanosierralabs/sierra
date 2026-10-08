import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la página: encabezado con acciones, filtros y grilla de tarjetas.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando proyectos">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-36 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-7 w-72 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>

      <Skeleton className="mb-3 h-4 w-28" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} className="overflow-hidden p-0">
            <Skeleton className="h-28 w-full rounded-none" />
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
