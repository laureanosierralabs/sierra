import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/sidebar-nav";
import { accesoActual } from "@/lib/landing/auth";
import { DEFINICIONES } from "@/lib/unidades";

export async function Sidebar() {
  const [{ esOwner, unidades }, usuario] = await Promise.all([
    accesoActual(),
    currentUser(),
  ]);

  // Un member con una sola unidad ve el nombre de esa unidad, no el del panel:
  // para él esto ES su panel.
  const soloUnidad = !esOwner && unidades.length === 1 ? unidades[0] : null;
  const titulo = soloUnidad ? DEFINICIONES[soloUnidad].nombre : "Sistema Operativo";

  const nombre =
    [usuario?.firstName, usuario?.lastName].filter(Boolean).join(" ").trim() ||
    usuario?.emailAddresses[0]?.emailAddress ||
    "";

  return (
    <aside className="flex h-full w-60 flex-col overflow-y-auto border-r border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/sierra.png"
            alt=""
            width={28}
            height={28}
            className="shrink-0 rounded-md"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-bold">
              {titulo}
            </span>
            <span className="block text-[0.6875rem] text-text-3">
              {esOwner ? "Owner" : "Builder"}
            </span>
          </span>
        </span>

        <ThemeToggle />
      </div>

      <nav className="flex flex-col gap-1 p-3">
        <SidebarNav esOwner={esOwner} unidades={unidades} />
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-line px-3 py-3">
        <UserButton />
        {nombre && (
          <span className="min-w-0 truncate text-sm text-text-2">{nombre}</span>
        )}
      </div>
    </aside>
  );
}
