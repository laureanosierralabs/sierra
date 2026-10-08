import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la página: encabezado con acción, plantilla y tabla.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando cotizaciones">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40 rounded-md" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <Card className="mb-6 flex items-center justify-between gap-3 px-4 py-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="size-4" />
      </Card>

      <DataTableSkeleton columns={9} rows={6} withToolbar={false} />
    </div>
  );
}
