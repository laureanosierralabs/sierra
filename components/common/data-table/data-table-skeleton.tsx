import { Card } from "@/components/tailgrids/core/card";
import { Skeleton } from "@/components/tailgrids/core/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";

interface DataTableSkeletonRowsProps {
  columns: number;
  rows?: number;
}

/** Solo las filas: se reutiliza dentro de `DataTable` mientras `isLoading`. */
export function DataTableSkeletonRows({ columns, rows = 5 }: DataTableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <TableRow key={row}>
          {Array.from({ length: columns }, (_, col) => (
            <TableCell key={col}>
              <Skeleton className="h-3.5 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

interface DataTableSkeletonProps extends DataTableSkeletonRowsProps {
  withToolbar?: boolean;
}

/** Esqueleto completo (barra + cabecera + filas) para `loading.tsx` y Suspense. */
export function DataTableSkeleton({
  columns,
  rows = 5,
  withToolbar = true,
}: DataTableSkeletonProps) {
  return (
    <Card className="overflow-hidden p-0">
      {withToolbar && (
        <div className="p-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
      )}
      <TableRoot fullBleed>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }, (_, col) => (
              <TableHead key={col}>
                <Skeleton className="h-3 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <DataTableSkeletonRows columns={columns} rows={rows} />
        </TableBody>
      </TableRoot>
    </Card>
  );
}
