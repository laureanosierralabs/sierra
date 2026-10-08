import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que el detalle: volver, título con acciones, ficha, gestión y recursos.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando proyecto">
      <Skeleton className="mb-4 h-4 w-24" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-72 max-w-full rounded-md" />
        <Skeleton className="h-5 w-16" />
      </div>

      <Card className="mb-8 overflow-hidden p-0">
        <Skeleton className="h-36 w-full rounded-none" />
        <div className="grid gap-x-10 gap-y-3 px-5 py-3 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Skeleton className="h-3.5 w-24 shrink-0" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-8">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 flex-1 rounded-xl" />
          ))}
        </div>
      </div>

      <Skeleton className="mb-3 h-4 w-36" />
      <DataTableSkeleton columns={4} rows={3} withToolbar={false} />
    </div>
  );
}
