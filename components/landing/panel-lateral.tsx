"use client";

import { useRouter } from "next/navigation";
import { Close, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import {
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/tailgrids/core/sheet";

/**
 * Panel que entra desde la derecha. Cerrarlo (X, Escape o click afuera) vuelve
 * atrás en el historial, porque se abre sobre una ruta interceptada. El Sheet
 * de React Aria aporta el portal, el focus trap y el bloqueo de scroll.
 */
export function PanelLateral({
  titulo,
  verCompletoEn,
  acciones,
  children,
}: {
  titulo: string;
  verCompletoEn: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    // Siempre abierto: el panel existe mientras la ruta interceptada esté
    // montada; al cerrar se navega y el slot vuelve a `default`.
    <SheetOverlay isOpen onOpenChange={(abierto) => !abierto && router.back()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 sm:w-[58%] sm:max-w-none sm:min-w-125"
      >
        <SheetHeader className="flex-row items-start justify-between gap-3 border-b border-card-border px-5 py-4">
          <SheetTitle className="min-w-0 text-lg leading-6">{titulo}</SheetTitle>

          <span className="flex shrink-0 items-center gap-3 text-text-tertiary">
            {acciones}
            <a
              href={verCompletoEn}
              aria-label="Abrir en pantalla completa"
              title="Abrir en pantalla completa"
              className="rounded outline-none transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4"
            >
              <ExpandArrowTopRightSquare1 />
            </a>
            <SheetClose
              aria-label="Cerrar"
              className="rounded transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-5"
            >
              <Close />
            </SheetClose>
          </span>
        </SheetHeader>

        <SheetBody className="mx-0 px-5 py-5">{children}</SheetBody>
      </SheetContent>
    </SheetOverlay>
  );
}
