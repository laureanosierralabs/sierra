/**
 * Registro de unidades de negocio. Es la fuente de verdad para el sidebar y
 * para los permisos: agregar una unidad acá la habilita en los dos lados.
 *
 * Sin `server-only` a propósito: el sidebar es un Client Component.
 */

export const UNIDADES = [
  "landing-pages",
  "marca-personal",
  "synous-ai",
  "wonder-digital",
] as const;

export type Unidad = (typeof UNIDADES)[number];

export interface DefinicionUnidad {
  slug: Unidad;
  nombre: string;
  /** Ruta interna, o URL externa cuando la unidad vive fuera de este panel. */
  href: string;
  externa?: boolean;
  /** Secciones internas; solo las unidades con panel propio las tienen. */
  secciones?: { href: string; label: string; icono: string }[];
}

export const DEFINICIONES: Record<Unidad, DefinicionUnidad> = {
  "landing-pages": {
    slug: "landing-pages",
    nombre: "Landing Pages",
    href: "/landing-pages",
    secciones: [
      { href: "/landing-pages", label: "Inicio", icono: "LayoutGrid" },
      { href: "/landing-pages/projects", label: "Proyectos", icono: "FolderKanban" },
      { href: "/landing-pages/tasks", label: "Tareas", icono: "ListChecks" },
      { href: "/landing-pages/clients", label: "Clientes", icono: "Users" },
      { href: "/landing-pages/quotes", label: "Cotizaciones", icono: "FileText" },
      { href: "/landing-pages/team", label: "Equipo", icono: "UserCog" },
    ],
  },
  "marca-personal": {
    slug: "marca-personal",
    nombre: "Marca Personal",
    href: "/unidad/marca-personal",
  },
  "synous-ai": {
    slug: "synous-ai",
    nombre: "Synous AI",
    href: "https://admin.synousai.com/",
    externa: true,
  },
  "wonder-digital": {
    slug: "wonder-digital",
    nombre: "Wonder Digital",
    href: "/unidad/wonder-digital",
  },
};

function esUnidad(v: unknown): v is Unidad {
  return typeof v === "string" && (UNIDADES as readonly string[]).includes(v);
}

/** Unidades declaradas en publicMetadata.units. Descarta valores desconocidos. */
export function parsearUnidades(units: unknown): Unidad[] {
  if (!Array.isArray(units)) return [];
  return units.filter(esUnidad);
}

/**
 * Unidad a la que pertenece una ruta interna. Null cuando la ruta no es de
 * ninguna unidad (Inicio, Finanzas): eso es territorio del owner.
 */
export function unidadDeRuta(pathname: string): Unidad | null {
  for (const def of Object.values(DEFINICIONES)) {
    if (def.externa) continue;
    if (pathname === def.href || pathname.startsWith(`${def.href}/`)) {
      return def.slug;
    }
  }
  return null;
}

export function puedeVerRuta(
  esOwner: boolean,
  unidades: Unidad[],
  pathname: string,
): boolean {
  if (esOwner) return true;
  const unidad = unidadDeRuta(pathname);
  return unidad !== null && unidades.includes(unidad);
}

/** Adónde mandar a alguien que no puede ver lo que pidió. */
export function rutaInicial(esOwner: boolean, unidades: Unidad[]): string {
  if (esOwner) return "/";
  const primera = unidades[0];
  return primera ? DEFINICIONES[primera].href : "/sin-acceso";
}
