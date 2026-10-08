import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Contenedor de página: mismo ancho y márgenes que las rutas de Landing Pages. */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-[1600px] px-8 py-8", className)}>{children}</div>;
}
