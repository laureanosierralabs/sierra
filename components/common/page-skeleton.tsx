import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

/** Esqueleto genérico de página: encabezado, fila de métricas y una tabla. */
export function PageSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-7 w-56 rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="flex flex-col gap-4">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>

      <DataTableSkeleton columns={5} rows={5} />
    </div>
  );
}
