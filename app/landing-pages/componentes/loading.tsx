import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la página: encabezado con acción, buscador, chips y grilla.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando componentes">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40 rounded-md" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      <Skeleton className="mb-3 h-10 w-full max-w-md rounded-lg" />
      <div className="mb-4 flex gap-1.5">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} className="overflow-hidden p-0">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
