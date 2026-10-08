import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la página: encabezado con exportar, indicadores y tablas.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando finanzas">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="flex flex-col gap-4">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-20" />
          </Card>
        ))}
      </div>
      <Card className="mb-8 flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </Card>

      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
          <DataTableSkeleton columns={5} rows={4} withToolbar={false} />
        </div>
      ))}
    </div>
  );
}
