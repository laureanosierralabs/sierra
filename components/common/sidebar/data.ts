import { DEFINICIONES, type Unidad } from "@/lib/unidades";

/**
 * Navegación del shell. Se arma a partir de `lib/unidades.ts` (misma fuente de
 * verdad que los permisos del proxy) y del acceso del usuario. Es datos puros
 * y serializables: los íconos viajan como clave y se resuelven en `nav-icon`.
 */

export interface NavChild {
  title: string;
  url: string;
  /** Activo solo con la ruta exacta (p. ej. el "Inicio" de una unidad). */
  exact?: boolean;
}

export interface NavEntry {
  /** Único dentro del nav; es el id del Disclosure cuando hay hijos. */
  id: string;
  title: string;
  icon: string;
  url?: string;
  external?: boolean;
  exact?: boolean;
  items?: NavChild[];
}

export interface NavSection {
  label: string;
  items: NavEntry[];
}

/** Unidades que el owner ve en el sidebar (Wonder Digital solo la ven los members). */
const UNIDADES_OWNER: Unidad[] = ["landing-pages", "marca-personal", "synous-ai"];

/** Secciones de una unidad según rol: las `owner` no las ve un Builder. */
function seccionesDe(unidad: Unidad, esOwner: boolean) {
  return (DEFINICIONES[unidad].secciones ?? []).filter((s) => esOwner || !s.owner);
}

function entradaUnidad(unidad: Unidad, esOwner: boolean): NavEntry {
  const def = DEFINICIONES[unidad];
  const base = { id: def.slug, title: def.nombre, icon: def.slug };

  if (def.secciones) {
    return {
      ...base,
      items: seccionesDe(unidad, esOwner).map((s) => ({
        title: s.label,
        url: s.href,
        exact: s.href === def.href,
      })),
    };
  }

  return { ...base, url: def.href, external: def.externa };
}

/**
 * Un member con una sola unidad ve sus secciones planas, sin el nivel de
 * agrupación: no hay nada entre qué elegir.
 */
export function buildNav(esOwner: boolean, unidades: Unidad[]): NavSection[] {
  if (!esOwner && unidades.length === 1) {
    const unidad = unidades[0];
    const def = DEFINICIONES[unidad];

    if (!def.secciones) {
      return [{ label: def.nombre, items: [entradaUnidad(unidad, esOwner)] }];
    }

    return [
      {
        label: def.nombre,
        items: seccionesDe(unidad, esOwner).map((s) => ({
          id: s.href,
          title: s.label,
          icon: s.icono,
          url: s.href,
          exact: s.href === def.href,
        })),
      },
    ];
  }

  const visibles = esOwner ? UNIDADES_OWNER : unidades;
  const secciones: NavSection[] = [];

  if (esOwner) {
    secciones.push({
      label: "General",
      items: [
        { id: "inicio", title: "Inicio", icon: "inicio", url: "/", exact: true },
        { id: "finanzas", title: "Finanzas", icon: "finanzas", url: "/finanzas/personal" },
        { id: "equipo", title: "Equipo", icon: "equipo", url: "/equipo" },
      ],
    });
  }

  if (visibles.length > 0) {
    secciones.push({
      label: "Unidades",
      items: visibles.map((u) => entradaUnidad(u, esOwner)),
    });
  }

  return secciones;
}

/** Entradas navegables (hojas y hijos) para el buscador. */
export interface NavLeaf {
  id: string;
  title: string;
  parentTitle?: string;
  section: string;
  url: string;
  icon: string;
  external?: boolean;
}

export function flattenNav(sections: NavSection[]): NavLeaf[] {
  const leaves: NavLeaf[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      if (item.url) {
        leaves.push({
          id: item.url,
          title: item.title,
          section: section.label,
          url: item.url,
          icon: item.icon,
          external: item.external,
        });
      }
      for (const child of item.items ?? []) {
        leaves.push({
          id: child.url,
          title: child.title,
          parentTitle: item.title,
          section: section.label,
          url: child.url,
          icon: item.icon,
        });
      }
    }
  }

  return leaves;
}

/** Etiquetas de rutas conocidas para los breadcrumbs (no dependen del permiso). */
export const ROUTE_LABELS: Record<string, string> = (() => {
  const labels: Record<string, string> = {
    "/": "Inicio",
    "/finanzas/personal": "Finanzas",
    "/equipo": "Equipo",
  };

  for (const def of Object.values(DEFINICIONES)) {
    if (def.externa) continue;
    labels[def.href] = def.nombre;
    for (const s of def.secciones ?? []) {
      // El "Inicio" de la unidad ya quedó con el nombre de la unidad.
      if (s.href !== def.href) labels[s.href] = s.label;
    }
  }

  return labels;
})();
