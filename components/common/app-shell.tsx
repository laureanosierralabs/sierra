"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Header } from "@/components/common/header";
import { buildNav, flattenNav } from "@/components/common/sidebar/data";
import { Sidebar } from "@/components/common/sidebar";
import { SheetContent, SheetOverlay, SheetTitle } from "@/components/tailgrids/core/sheet";
import type { Unidad } from "@/lib/unidades";
import { cn } from "@/utils/cn";

interface AppShellProps {
  esOwner: boolean;
  unidades: Unidad[];
  titulo: string;
  rolLabel: string;
  children: ReactNode;
}

/**
 * Cáscara de la app: sidebar (xl+ fijo y colapsable, < xl en un Sheet), header
 * y un único contenedor con scroll (`main`). Recibe el acceso ya resuelto en el
 * servidor; acá solo vive el estado de apertura.
 */
export function AppShell({ esOwner, unidades, titulo, rolLabel, children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const sections = useMemo(() => buildNav(esOwner, unidades), [esOwner, unidades]);
  const leaves = useMemo(() => flattenNav(sections), [sections]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background-gray-primary">
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden transition-[width,min-width] duration-300 ease-in-out xl:block",
          isSidebarOpen ? "w-67.5 min-w-67.5" : "w-18 min-w-18",
        )}
      >
        <Sidebar
          sections={sections}
          titulo={titulo}
          rolLabel={rolLabel}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
      </aside>

      <SheetOverlay isOpen={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-67.5! max-w-67.5! border-r border-card-border bg-card-surface-area p-0"
        >
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <Sidebar
            sections={sections}
            titulo={titulo}
            rolLabel={rolLabel}
            isSidebarOpen
            toggleSidebar={() => setIsMobileSheetOpen(false)}
            onItemClick={() => setIsMobileSheetOpen(false)}
            isMobileSheet
          />
        </SheetContent>
      </SheetOverlay>

      <div className={cn("min-w-0 flex-1", isSidebarOpen ? "lg:p-4 xl:pr-4" : "lg:py-4 xl:px-4")}>
        <div className="flex h-full flex-col overflow-hidden border-[0.5px] border-card-surface-border bg-card-surface-area lg:rounded-2xl lg:shadow-xs">
          <Header
            leaves={leaves}
            esOwner={esOwner}
            onMenuClick={() => setIsMobileSheetOpen(true)}
          />

          {/* main is the scroll container, so body scroll locks don't reach it:
              lock it while an inline modal overlay is open. */}
          <main className="min-h-0 flex-1 overflow-y-auto has-aria-modal:overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
