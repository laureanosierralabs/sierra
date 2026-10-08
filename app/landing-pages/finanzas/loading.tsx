import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la página: encabezado con filtros, pestañas, indicadores,
// cuatro gráficos y la tabla de balance.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando finanzas">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-card-border py-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-24" />
        ))}
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

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="flex flex-col gap-4">
            <Skeleton className="h-5 w-56 max-w-full" />
            <Skeleton className="h-60 w-full rounded-lg" />
          </Card>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-48" />
      </div>
      <DataTableSkeleton columns={5} rows={4} withToolbar={false} />
    </div>
  );
}
