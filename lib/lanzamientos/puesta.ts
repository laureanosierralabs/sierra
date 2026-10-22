/**
 * "Listo para compartir": la lista de lo que un lanzamiento necesita para
 * mostrarse completo y con datos reales en el portal del cliente. Se calcula
 * sola con lo cargado; nadie la tilda a mano. Lógica pura (se testea sin base).
 */
import { RECURSOS, VERSIONES_PDF, type Entregables } from "@/lib/portal/entrega";
import {
  resumirRegistros,
  resumirVisitas,
  type Compra,
  type Lanzamiento,
  type PaginaLanzamiento,
  type Registro,
  type VisitaAgregada,
} from "@/lib/lanzamientos/tipos";

export type EstadoChequeo = "ok" | "falta" | "sugerido";
export type GrupoChequeo = "Lanzamiento" | "Landings" | "Datos" | "Portal";

export interface Chequeo {
  id: string;
  grupo: GrupoChequeo;
  titulo: string;
  /** "falta" bloquea el "listo"; "sugerido" suma, pero no bloquea. */
  estado: EstadoChequeo;
  /** Qué falta, en concreto (nombres de landings, cantidades). */
  detalle?: string;
  /** Dónde se arregla. */
  donde: "configuracion" | "ficha-portal" | "ficha-accesos" | "editar";
}

export interface EntradaPuesta {
  lanzamiento: Pick<Lanzamiento, "starts_on" | "ends_on" | "goal_registrations" | "cover_url" | "banner_url">;
  paginas: (Pick<PaginaLanzamiento, "id" | "name" | "url" | "kind" | "site_id" | "path"> & { deliverables: Entregables })[];
  registros: Pick<Registro, "page_id" | "registered_at">[];
  visitas: VisitaAgregada[];
  compras: Pick<Compra, "page_id">[];
  /** MailerLite conectado por webhook (los registros entran solos). */
  mailerliteConectado: boolean;
  /** undefined = no se pudo consultar (no se marca como falta). */
  portal?: { habilitado: boolean; personas: number; portada: boolean } | undefined;
  accesosEnPortal: number;
}

const lista = (nombres: string[], max = 3) =>
  nombres.length <= max ? nombres.join(", ") : `${nombres.slice(0, max).join(", ")} y ${nombres.length - max} más`;

export function evaluarPuesta(e: EntradaPuesta): Chequeo[] {
  const { lanzamiento: l, paginas } = e;
  const regs = resumirRegistros(e.registros as Registro[]);
  const vis = resumirVisitas(e.visitas);
  const c: Chequeo[] = [];

  /* ── Lanzamiento ── */
  const sinFechas = [!l.starts_on && "inicio", !l.ends_on && "cierre"].filter(Boolean) as string[];
  c.push({
    id: "fechas",
    grupo: "Lanzamiento",
    titulo: "Fechas de inicio y cierre",
    estado: sinFechas.length === 0 ? "ok" : "falta",
    detalle: sinFechas.length ? `Falta la fecha de ${sinFechas.join(" y ")}` : undefined,
    donde: "editar",
  });
  c.push({
    id: "meta",
    grupo: "Lanzamiento",
    titulo: "Meta de registros",
    estado: l.goal_registrations ? "ok" : "sugerido",
    detalle: l.goal_registrations ? undefined : "Sin meta no hay % de avance ni proyección",
    donde: "editar",
  });
  c.push({
    id: "flyer",
    grupo: "Lanzamiento",
    titulo: "Flyer (tarjeta del inicio del portal)",
    estado: l.cover_url ? "ok" : "falta",
    donde: "configuracion",
  });
  c.push({
    id: "banner",
    grupo: "Lanzamiento",
    titulo: "Banner (portada del lanzamiento)",
    estado: l.banner_url ? "ok" : "falta",
    donde: "configuracion",
  });

  /* ── Landings ── */
  c.push({
    id: "landings",
    grupo: "Landings",
    titulo: "Landings cargadas",
    estado: paginas.length > 0 ? "ok" : "falta",
    detalle: paginas.length > 0 ? `${paginas.length} ${paginas.length === 1 ? "landing" : "landings"}` : undefined,
    donde: "configuracion",
  });
  if (paginas.length > 0) {
    const sinUrl = paginas.filter((p) => !p.url).map((p) => p.name);
    c.push({
      id: "urls",
      grupo: "Landings",
      titulo: "Cada landing con su link",
      estado: sinUrl.length === 0 ? "ok" : "falta",
      detalle: sinUrl.length ? `Sin link: ${lista(sinUrl)}` : undefined,
      donde: "configuracion",
    });

    const sinPdf = paginas.filter((p) => VERSIONES_PDF.some((v) => !p.deliverables[v.clave])).map((p) => p.name);
    const sinRecursos = paginas
      .filter((p) => RECURSOS.every((r) => !p.deliverables[r.clave]) && !(p.deliverables.extras?.length ?? 0))
      .map((p) => p.name);
    c.push({
      id: "pdfs",
      grupo: "Landings",
      titulo: "Versiones en PDF (ordenador, celular y tablet)",
      estado: sinPdf.length === 0 ? "ok" : "sugerido",
      detalle: sinPdf.length ? `Incompletas: ${lista(sinPdf)}` : undefined,
      donde: "configuracion",
    });
    c.push({
      id: "recursos",
      grupo: "Landings",
      titulo: "Recursos descargables",
      estado: sinRecursos.length === 0 ? "ok" : "sugerido",
      detalle: sinRecursos.length ? `Sin ninguno: ${lista(sinRecursos)}` : undefined,
      donde: "configuracion",
    });
  }

  /* ── Datos ── */
  if (paginas.length > 0) {
    const sinVisitas = paginas.filter((p) => !(vis.porPagina[p.id] > 0)).map((p) => p.name);
    c.push({
      id: "visitas",
      grupo: "Datos",
      titulo: "Visitas medidas en cada landing",
      estado: sinVisitas.length === 0 ? "ok" : "falta",
      detalle: sinVisitas.length
        ? `Sin visitas: ${lista(sinVisitas)}. Sin ellas la conversión sale "—": conectá el proyecto (kit) o pegá el script.`
        : undefined,
      donde: "configuracion",
    });

    const deRegistro = paginas.filter((p) => p.kind !== "venta");
    if (deRegistro.length > 0) {
      const sinRegistros = deRegistro.filter((p) => !(regs.porPagina[p.id] > 0)).map((p) => p.name);
      c.push({
        id: "registros",
        grupo: "Datos",
        titulo: "Registros llegando a cada landing de registro",
        estado: sinRegistros.length === 0 ? "ok" : "falta",
        detalle: sinRegistros.length ? `Sin registros: ${lista(sinRegistros)}` : undefined,
        donde: "configuracion",
      });
      c.push({
        id: "mailerlite",
        grupo: "Datos",
        titulo: "Registros en tiempo real (MailerLite conectado)",
        estado: e.mailerliteConectado ? "ok" : "sugerido",
        detalle: e.mailerliteConectado ? undefined : "Sin conexión, los registros nuevos solo llegan importando el CSV",
        donde: "configuracion",
      });
    }

    const deVenta = paginas.filter((p) => p.kind === "venta");
    if (deVenta.length > 0) {
      // Las compras se miden por el kit, por proyecto y ruta: una landing de
      // venta suelta (o sin ruta) no las reporta.
      const sinMedir = deVenta.filter((p) => !p.site_id || !p.path).map((p) => p.name);
      c.push({
        id: "ventas",
        grupo: "Datos",
        titulo: "Ventas medidas en las landings de venta",
        estado: sinMedir.length === 0 ? "ok" : "falta",
        detalle: sinMedir.length ? `Sin proyecto conectado o sin ruta: ${lista(sinMedir)}` : undefined,
        donde: "configuracion",
      });
    }
  }

  /* ── Portal ── */
  if (e.portal !== undefined) {
    c.push({
      id: "portal",
      grupo: "Portal",
      titulo: "Portal del cliente habilitado",
      estado: e.portal.habilitado ? "ok" : "falta",
      donde: "ficha-portal",
    });
    if (e.portal.habilitado) {
      c.push({
        id: "personas",
        grupo: "Portal",
        titulo: "Alguien con acceso al portal",
        estado: e.portal.personas > 0 ? "ok" : "falta",
        detalle: e.portal.personas > 0 ? `${e.portal.personas} con acceso o invitación` : "Invitá a la marca o a quien la opera",
        donde: "ficha-portal",
      });
      c.push({
        id: "portada",
        grupo: "Portal",
        titulo: "Portada del portal",
        estado: e.portal.portada ? "ok" : "sugerido",
        donde: "ficha-portal",
      });
    }
  }
  c.push({
    id: "accesos",
    grupo: "Portal",
    titulo: "Accesos visibles en el portal",
    estado: e.accesosEnPortal > 0 ? "ok" : "sugerido",
    detalle: e.accesosEnPortal > 0 ? `${e.accesosEnPortal} visibles` : 'Marcá "En el portal" en los accesos de su ficha',
    donde: "ficha-accesos",
  });

  return c;
}

/** Listo = no falta nada obligatorio. */
export function resumenPuesta(chequeos: Chequeo[]) {
  const faltan = chequeos.filter((c) => c.estado === "falta").length;
  const ok = chequeos.filter((c) => c.estado === "ok").length;
  return { listo: faltan === 0, faltan, ok, total: chequeos.length };
}
