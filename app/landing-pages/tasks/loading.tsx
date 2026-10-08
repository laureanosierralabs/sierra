import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la página: encabezado, selector de vista, pestañas y tabla.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando tareas">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <Skeleton className="mb-4 h-12 w-56 rounded-lg" />
      <Skeleton className="mb-4 h-9 w-48 rounded-md" />

      <DataTableSkeleton columns={7} rows={6} withToolbar={false} />
    </div>
  );
}
