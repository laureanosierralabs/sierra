import { Boxes } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/sidebar-nav";
import { accesoActual } from "@/lib/landing/auth";
import { DEFINICIONES } from "@/lib/unidades";

export async function Sidebar() {
  const { esOwner, unidades } = await accesoActual();

  // Un member con una sola unidad ve el nombre de esa unidad, no el del panel:
  // para él esto ES su panel.
  const soloUnidad = !esOwner && unidades.length === 1 ? unidades[0] : null;
  const titulo = soloUnidad ? DEFINICIONES[soloUnidad].nombre : "Sistema Operativo";

  return (
    <aside className="flex h-full w-60 flex-col overflow-y-auto border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-text text-ground">
          <Boxes className="size-4" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold">{titulo}</p>
          <p className="text-[0.6875rem] text-text-3">Laureano Sierra</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        <SidebarNav esOwner={esOwner} unidades={unidades} />
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line p-3">
        <ThemeToggle />
        <UserButton />
      </div>
    </aside>
  );
}
