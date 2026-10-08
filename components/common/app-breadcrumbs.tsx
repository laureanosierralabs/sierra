"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ROUTE_LABELS } from "@/components/common/sidebar/data";
import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";

const STATIC_LABELS: Record<string, string> = { nuevo: "Nuevo" };

interface Crumb {
  href: string;
  label: string;
}

/**
 * Migas a partir de la ruta. Solo entran los tramos con página conocida (las
 * etiquetas salen de `lib/unidades.ts`); los intermedios sin página
 * (`/unidad`, `/proyecto`, `/acuerdo`) se omiten y el tramo final dinámico
 * (id o slug) se muestra como "Detalle".
 */
function crumbsFor(pathname: string, conInicio: boolean): Crumb[] {
  const crumbs: Crumb[] = [];
  if (conInicio && pathname !== "/") crumbs.push({ href: "/", label: ROUTE_LABELS["/"] });

  const segments = pathname.split("/").filter(Boolean);
  let acumulado = "";

  segments.forEach((segment, i) => {
    acumulado += `/${segment}`;
    const label = ROUTE_LABELS[acumulado];
    if (label) {
      crumbs.push({ href: acumulado, label });
    } else if (i === segments.length - 1) {
      crumbs.push({ href: acumulado, label: STATIC_LABELS[segment] ?? "Detalle" });
    }
  });

  if (pathname === "/") crumbs.push({ href: "/", label: ROUTE_LABELS["/"] });
  return crumbs;
}

export function AppBreadcrumbs({ esOwner }: { esOwner: boolean }) {
  const pathname = usePathname();
  const items = useMemo(() => crumbsFor(pathname, esOwner), [pathname, esOwner]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className="min-w-0">
      <Breadcrumbs items={items} dividerType="chevron" className="truncate" />
    </nav>
  );
}
