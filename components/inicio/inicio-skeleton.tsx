import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton";
import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

function ListaSkeleton({ filas }: { filas: number }) {
  return (
    <Card className="p-0">
      <div className="border-b border-card-border px-6 py-4">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex flex-col gap-4 p-6">
        {Array.from({ length: filas }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </Card>
  );
}

/** Esqueleto de Inicio: encabezado, 4 KPIs, dos listas, gráfico y tabla. */
export function InicioSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-7 w-64 rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="flex flex-col gap-4">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ListaSkeleton filas={5} />
        </div>
        <ListaSkeleton filas={4} />
      </div>

      <Skeleton className="mb-6 h-64 w-full rounded-xl" />
      <DataTableSkeleton columns={5} rows={4} />
    </div>
  );
}
