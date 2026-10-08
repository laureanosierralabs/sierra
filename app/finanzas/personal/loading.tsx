import { PageContainer } from "@/components/common/page-container";
import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";

/** Esqueleto de Finanzas: encabezado, selector de vistas, indicadores y gráficos. */
export default function Loading() {
  return (
    <PageContainer>
      <div role="status" aria-busy="true" aria-label="Cargando finanzas">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-32 rounded-md" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-9 w-80 max-w-full rounded-lg" />
        </div>
        <Skeleton className="mb-6 h-10 w-96 max-w-full rounded-lg" />

        <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="flex flex-col gap-4">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-36" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card className="h-80 xl:col-span-2">
            <Skeleton className="size-full" />
          </Card>
          <Card className="h-80">
            <Skeleton className="size-full" />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
