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
  "aura-studio",
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
  secciones?: {
    href: string;
    label: string;
    icono: string;
    /** Solo el owner la ve. */
    owner?: boolean;
    /** Solo la ve el equipo, no el owner (por ejemplo, sus cobros). */
    soloEquipo?: boolean;
  }[];
}

export const DEFINICIONES: Record<Unidad, DefinicionUnidad> = {
  "landing-pages": {
    slug: "landing-pages",
    nombre: "Landing Pages",
    href: "/landing-pages",
    // `owner: true` = sección reservada. Un Builder no la ve ni puede entrar.
    secciones: [
      { href: "/landing-pages", label: "Inicio", icono: "LayoutGrid" },
      { href: "/landing-pages/projects", label: "Proyectos", icono: "FolderKanban" },
      { href: "/landing-pages/tasks", label: "Tareas", icono: "ListChecks" },
      { href: "/landing-pages/clients", label: "Clientes", icono: "Users" },
      {
        href: "/landing-pages/puesta-a-punto",
        label: "Puesta a punto",
        icono: "Rocket",
        owner: true,
      },
      { href: "/landing-pages/pedidos", label: "Pedidos", icono: "Inbox" },
      { href: "/landing-pages/mis-cobros", label: "Mis cobros", icono: "Wallet", soloEquipo: true },
      {
        href: "/landing-pages/quotes",
        label: "Cotizaciones",
        icono: "FileText",
        owner: true,
      },
      {
        href: "/landing-pages/finanzas",
        label: "Finanzas",
        icono: "ChartLine",
        owner: true,
      },
      {
        href: "/landing-pages/team",
        label: "Equipo",
        icono: "UserCog",
        owner: true,
      },
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
  "aura-studio": {
    slug: "aura-studio",
    nombre: "Aura Studio",
    href: "https://www.aurastudio.com.ar/admin",
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
  if (unidad === null || !unidades.includes(unidad)) return false;

  // Ocultar el link no alcanza: la ruta también tiene que rebotar.
  const reservada = (DEFINICIONES[unidad].secciones ?? []).find(
    (s) =>
      s.owner && (pathname === s.href || pathname.startsWith(`${s.href}/`)),
  );

  return !reservada;
}

/** Adónde mandar a alguien que no puede ver lo que pidió. */
export function rutaInicial(esOwner: boolean, unidades: Unidad[]): string {
  if (esOwner) return "/";
  const primera = unidades[0];
  return primera ? DEFINICIONES[primera].href : "/sin-acceso";
}

/* ───────────── Portal de clientes ───────────── */

export const RUTA_PORTAL = "/portal";

export function esRutaPortal(pathname: string): boolean {
  return pathname === RUTA_PORTAL || pathname.startsWith(`${RUTA_PORTAL}/`);
}

/**
 * Usuario de un cliente: entra por una invitación del panel que fija
 * `role: "client"`. Tiene que ser explícito: un usuario sin rol es del equipo
 * (member), y un cliente nunca puede heredar ese acceso por defecto.
 */
export function esUsuarioCliente(metadata: unknown): boolean {
  return (metadata as { role?: unknown } | undefined)?.role === "client";
}
