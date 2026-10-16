/**
 * "Cargar todas las landings": arma las landings de un lanzamiento solas, a
 * partir de lo que ya se sabe del cliente. Lógica pura: decide qué agregar;
 * la server action lee los datos y guarda.
 *
 * Dos fuentes, en este orden:
 *   1. Sus proyectos (cada landing cargada como proyecto), con su URL.
 *   2. Las rutas que el kit ya detectó con visitas en su proyecto conectado,
 *      aunque nadie las haya cargado como proyecto.
 */
import { landingDesdeProyecto, normalizarRuta } from "@/lib/sitios/tipos";
import { tipoLandingDeProyecto, type TipoLanding } from "@/lib/lanzamientos/tipos";

export interface ProyectoParaPlan {
  id: string;
  name: string;
  site_url: string | null;
  page_type: string | null;
}

export interface SitioParaPlan {
  id: string;
  domain: string | null;
  /** Rutas con visitas, de la más visitada a la menos. */
  rutas: string[];
}

export interface LandingPlaneada {
  name: string;
  kind: TipoLanding;
  url: string | null;
  project_id: string | null;
  site_id: string | null;
  path: string | null;
}

/* Reciben visitas pero no son landings: medirlas como tales ensucia la conversión. */
const NO_ES_LANDING =
  /(^|\/)(gracias|thank-?you|thanks|confirmaci[oó]n|confirmado|success|exito|éxito|privacidad|privacy|terminos|términos|terms|politica|política|legal|cookies|404|api|_next|admin|login)(\/|$)/i;

export const esRutaDeLanding = (ruta: string) => !NO_ES_LANDING.test(ruta);

const RUTA_DE_VENTA = /(^|[/-])(venta|ventas|compra|comprar|checkout|oferta|pago|precio|precios)([/-]|$)/i;

/** "/lista-de-espera" → "Lista de espera"; "/" → "Inicio". */
export function nombreDeRuta(ruta: string): string {
  const ultimo = ruta.split("/").filter(Boolean).at(-1);
  if (!ultimo) return "Inicio";
  const texto = decodeURIComponent(ultimo).replace(/[-_]+/g, " ").trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const urlDe = (dominio: string | null, ruta: string) =>
  dominio ? `https://${dominio.replace(/^https?:\/\//, "").replace(/\/+$/, "")}${ruta}` : null;

/**
 * Landings que faltan en el lanzamiento. No repite un proyecto ya cargado ni
 * una ruta (proyecto conectado + ruta) ya usada.
 */
export function planificarLandings(
  proyectos: ProyectoParaPlan[],
  sitios: SitioParaPlan[],
  existentes: { project_id: string | null; site_id: string | null; path: string | null }[],
): LandingPlaneada[] {
  const proyectosUsados = new Set(existentes.map((e) => e.project_id).filter(Boolean));
  const rutasUsadas = new Set(existentes.filter((e) => e.site_id && e.path).map((e) => `${e.site_id} ${e.path}`));
  const plan: LandingPlaneada[] = [];

  const ordenados = [...proyectos].sort((a, b) => a.name.localeCompare(b.name, "es"));
  for (const p of ordenados) {
    if (proyectosUsados.has(p.id)) continue;
    const sugerida = landingDesdeProyecto(p, sitios);
    const clave = sugerida.site_id && sugerida.path ? `${sugerida.site_id} ${sugerida.path}` : null;
    // Dos proyectos con la misma URL: la ruta (y sus métricas) va solo en el primero.
    const conRuta = clave !== null && !rutasUsadas.has(clave);
    if (clave && conRuta) rutasUsadas.add(clave);
    plan.push({
      name: sugerida.name,
      kind: tipoLandingDeProyecto(p.page_type),
      url: sugerida.url,
      project_id: p.id,
      site_id: conRuta ? sugerida.site_id : null,
      path: conRuta ? sugerida.path : null,
    });
  }

  for (const s of sitios) {
    for (const cruda of s.rutas) {
      const ruta = normalizarRuta(cruda);
      if (!ruta || !esRutaDeLanding(ruta) || rutasUsadas.has(`${s.id} ${ruta}`)) continue;
      rutasUsadas.add(`${s.id} ${ruta}`);
      plan.push({
        name: nombreDeRuta(ruta),
        // Sin proyecto no hay tipo cargado: solo los nombres obvios van como venta.
        kind: RUTA_DE_VENTA.test(ruta) ? "venta" : "registro",
        url: urlDe(s.domain, ruta),
        project_id: null,
        site_id: s.id,
        path: ruta,
      });
    }
  }
  return plan;
}
