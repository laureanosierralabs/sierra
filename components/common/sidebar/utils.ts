import type { NavChild, NavEntry, NavSection } from "./data";

/**
 * Coincide con la ruta exacta o con cualquier subruta. "/" solo coincide
 * consigo misma, si no estaría activo en todas partes.
 */
export function isPathActive(href: string, pathname: string, exact = false): boolean {
  if (!href) return false;
  if (href === "/" || exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isChildActive(child: NavChild, pathname: string): boolean {
  return isPathActive(child.url, pathname, child.exact);
}

export function isEntryActive(entry: NavEntry, pathname: string): boolean {
  return entry.url ? isPathActive(entry.url, pathname, entry.exact) : false;
}

export function hasActiveChild(entry: NavEntry, pathname: string): boolean {
  return entry.items?.some((child) => isChildActive(child, pathname)) ?? false;
}

/** Id del grupo cuyo hijo coincide con la ruta actual, o null. */
export function findActiveGroupKey(sections: NavSection[], pathname: string): string | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (hasActiveChild(item, pathname)) return item.id;
    }
  }
  return null;
}
