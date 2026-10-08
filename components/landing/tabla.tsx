import { TableHead, TableHeader, TableRow } from "@/components/tailgrids/core/table";
import { cn } from "@/utils/cn";

/** Alto de fila usado para calcular dónde cortar. */
const FILA_PX = 45;
const LIMITE = 10;

/**
 * Contenedor de tabla con scroll propio.
 *
 * A partir de 10 filas la tabla scrollea por dentro en vez de estirar la
 * página, y en pantallas angostas scrollea de costado en lugar de apretar
 * las columnas hasta que no se lean.
 *
 * El header va sticky: sin eso, al scrollear se pierde qué significa cada
 * columna y hay que volver arriba para saberlo.
 */
export function Tabla({
  filas,
  children,
  className,
}: {
  /** Cuántas filas tiene el cuerpo, para decidir si limitar el alto. */
  filas: number;
  children: React.ReactNode;
  className?: string;
}) {
  const limitar = filas > LIMITE;

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border-[0.5px] border-card-border bg-card-background",
        limitar && "overflow-y-auto",
        className,
      )}
      // +1 por el header, que también ocupa alto dentro del contenedor.
      style={limitar ? { maxHeight: (LIMITE + 1) * FILA_PX } : undefined}
    >
      {children}
    </div>
  );
}

/** Cabecera sticky con fondo sólido, para que no se transparenten las filas al pasar. */
export function TablaHead({ columnas }: { columnas: string[] }) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-card-background">
      <TableRow>
        {columnas.map((h, i) => (
          <TableHead
            key={h || i}
            scope="col"
            className="px-4 py-2.5 text-xs font-medium whitespace-nowrap text-text-tertiary"
          >
            {h}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
