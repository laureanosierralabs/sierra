import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

// Misma forma que la página: encabezado con acción y tabla de miembros.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando equipo">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <DataTableSkeleton columns={7} rows={5} withToolbar={false} />
    </div>
  );
}
