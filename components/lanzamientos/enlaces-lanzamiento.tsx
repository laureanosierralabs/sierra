"use client";

import { useOptimistic, useSyncExternalStore, useTransition } from "react";
import { Copy1, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { FormError } from "@/components/common/form/form-error";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { estilosEnlaces } from "@/components/lanzamientos/enlaces-estilos";
import { marcarLugarPanel } from "@/app/landing-pages/enlaces-acciones";
import { guardarWebinarPortal, marcarLugarPortal } from "@/app/portal/enlaces-acciones";
import {
  HERRAMIENTAS,
  LUGARES,
  haceCuanto,
  hostDe,
  linkBase,
  linkCompartir,
  resumenEnlace,
  textoMarca,
  variableDe,
  type EstadoEnlace,
  type Herramienta,
  type Lugar,
  type MarcaLugar,
  type TipoEnlace,
} from "@/lib/lanzamientos/enlaces";
import { cn } from "@/utils/cn";

/** Panel del owner o portal del cliente: cambia solo a qué acciones se llama y el tono del texto. */
export type ModoEnlaces = { tipo: "panel" } | { tipo: "portal"; slug: string };

const TITULO: Record<TipoEnlace, string> = { webinar: "Webinar", grupo: "Grupo de WhatsApp" };

/** Texto según quién mira: el portal habla de "tú", el panel de "vos". */
const segun = (modo: ModoEnlaces, portal: string, panel: string) => (modo.tipo === "portal" ? portal : panel);

export interface DatosBloque {
  token: string;
  tieneDestino: boolean;
  usos: number;
  ultimoUso: string | null;
  marcas: MarcaLugar[];
}

/* ───────────── Herramienta de correo (una sola para los dos links) ───────────── */

const CLAVE_HERRAMIENTA = "enlaces:herramienta";
const oyentes = new Set<() => void>();

function leerHerramienta(): Herramienta {
  try {
    const v = window.localStorage.getItem(CLAVE_HERRAMIENTA);
    return HERRAMIENTAS.some((h) => h.id === v) ? (v as Herramienta) : "ghl";
  } catch {
    return "ghl";
  }
}

function suscribirHerramienta(cb: () => void) {
  oyentes.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    oyentes.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** La elección se recuerda en este navegador; los bloques y el selector comparten el mismo valor. */
function useHerramienta(): [Herramienta, (h: Herramienta) => void] {
  const actual = useSyncExternalStore(suscribirHerramienta, leerHerramienta, (): Herramienta => "ghl");
  const cambiar = (h: Herramienta) => {
    try {
      window.localStorage.setItem(CLAVE_HERRAMIENTA, h);
    } catch {
      /* sin almacenamiento: queda el valor por defecto */
    }
    oyentes.forEach((cb) => cb());
  };
  return [actual, cambiar];
}

const ETIQUETA_SELECTOR: Record<Herramienta, string> = {
  ghl: "GoHighLevel",
  mailerlite: "MailerLite",
  ninguna: "Otro (sin variable)",
};

/** "¿Con qué envías tus correos?": aplica a los dos links. */
export function SelectorHerramienta({ modo }: { modo: ModoEnlaces }) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const [herramienta, setHerramienta] = useHerramienta();
  const variable = variableDe(herramienta);
  return (
    <div className="flex flex-col gap-2">
      <p className={cn("text-sm font-medium", e.titulo)}>
        {segun(modo, "¿Con qué envías tus correos?", "¿Con qué mandás los correos?")}
      </p>
      <div
        role="group"
        aria-label={segun(modo, "Herramienta con la que envías tus correos", "Herramienta con la que mandás los correos")}
        className="flex flex-wrap gap-2"
      >
        {HERRAMIENTAS.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-pressed={h.id === herramienta}
            onClick={() => setHerramienta(h.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              e.chip,
              h.id === herramienta ? e.chipOn : e.chipOff,
            )}
          >
            {ETIQUETA_SELECTOR[h.id]}
          </button>
        ))}
      </div>
      <p className={cn("text-xs", e.pista)}>
        {variable
          ? `${variable} se reemplaza por el email de cada contacto: así sabemos quién entró.`
          : "Sin variable no sabemos quién entró. Úsalo para WhatsApp, redes o cualquier lugar sin el email del contacto."}
      </p>
    </div>
  );
}

/* ───────────── Bloque ───────────── */

type Tono = "ok" | "espera" | "falta";

function estadoVisible(tipo: TipoEnlace, estado: EstadoEnlace): { tono: Tono; texto: string } {
  if (estado === "funcionando") return { tono: "ok", texto: "Funcionando" };
  if (estado === "sin-usos") return { tono: "espera", texto: "Sin usos todavía" };
  return { tono: "falta", texto: tipo === "webinar" ? "Falta el link del Zoom" : "Faltan grupos" };
}

const PUNTO: Record<Tono, string> = { ok: "bg-emerald-500", espera: "bg-amber-500", falta: "bg-red-500" };

function lineaDeUsos(modo: ModoEnlaces, tipo: TipoEnlace, d: DatosBloque, ahoraIso: string): string {
  if (!d.tieneDestino) {
    return tipo === "webinar"
      ? segun(modo, "Pega el link de YouTube o Zoom para activarlo.", "Pegá el link de YouTube o Zoom para activarlo.")
      : segun(modo, "Carga los links de los grupos para activarlo.", "Cargá los links de los grupos para activarlo.");
  }
  if (d.usos <= 0) return "Nadie ha entrado todavía.";
  const cuando = haceCuanto(d.ultimoUso, ahoraIso);
  const n = d.usos.toLocaleString("es-AR");
  const quienes =
    tipo === "webinar"
      ? `${n} ${d.usos === 1 ? "persona entró" : "personas entraron"}`
      : `${n} ${d.usos === 1 ? "persona enviada" : "personas enviadas"} a un grupo`;
  return `${quienes}${cuando ? ` · la última ${cuando}` : ""}`;
}

/**
 * Un enlace del lanzamiento (webinar o grupo) como tarjeta: estado, el link
 * para pegar, el destino (en `children`) y dónde se puso. El link es estable:
 * siempre manda al destino actual, así que cambiarlo no obliga a tocar los
 * correos. La herramienta de correo se elige una vez para los dos (selector).
 */
export function BloqueEnlace({
  modo,
  launchId,
  tipo,
  dominio,
  ahoraIso,
  datos,
  lineaClave,
  children,
}: {
  modo: ModoEnlaces;
  launchId: string;
  tipo: TipoEnlace;
  dominio: string | null;
  /** "Ahora" del servidor: el "hace X" no cambia entre el servidor y el navegador. */
  ahoraIso: string;
  datos: DatosBloque;
  /** Frase con el número clave si hay una mejor que el conteo de usos (p. ej. "X de Y registrados entraron"). */
  lineaClave?: string;
  children?: React.ReactNode;
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const resumen = resumenEnlace({
    tieneDestino: datos.tieneDestino,
    usos: datos.usos,
    ultimoUso: datos.ultimoUso,
    ahoraIso,
  });
  const visible = estadoVisible(tipo, resumen.estado);
  const linea = datos.tieneDestino && datos.usos > 0 && lineaClave ? lineaClave : lineaDeUsos(modo, tipo, datos, ahoraIso);

  return (
    <section aria-label={TITULO[tipo]} className={cn("flex min-w-0 flex-col gap-4", e.tarjeta)}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 className={cn("text-base font-bold", e.titulo)}>{TITULO[tipo]}</h3>
          <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", e.estadoTexto[visible.tono])}>
            <span aria-hidden className={cn("size-2 rounded-full", PUNTO[visible.tono])} />
            {visible.texto}
          </span>
        </div>
        <p className={cn("text-sm tabular-nums", e.suave)}>{linea}</p>
      </div>

      <LinkParaCompartir modo={modo} tipo={tipo} token={datos.token} dominio={dominio} />

      {resumen.estado === "sin-usos" && (
        <p className={cn("text-xs", e.pista)}>
          {segun(
            modo,
            "Envíate el mail de prueba y toca el botón: en segundos esto pasa a Funcionando.",
            "Enviate el mail de prueba y tocá el botón: en segundos esto pasa a Funcionando.",
          )}
        </p>
      )}

      {children}

      <Lugares modo={modo} launchId={launchId} tipo={tipo} marcas={datos.marcas} />
    </section>
  );
}

/* ───────────── Link para compartir ───────────── */

async function copiar(valor: string) {
  try {
    await navigator.clipboard.writeText(valor);
    toast.success("Link copiado");
  } catch {
    toast.error("No se pudo copiar");
  }
}

function LinkParaCompartir({
  modo,
  tipo,
  token,
  dominio,
}: {
  modo: ModoEnlaces;
  tipo: TipoEnlace;
  token: string;
  dominio: string | null;
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const [herramienta] = useHerramienta();
  // El origen se lee en el navegador: así sirve igual en local, preview y producción.
  const origen = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const base = linkBase(tipo, token, dominio, origen || "https://…");
  const link = linkCompartir(base, herramienta);

  return (
    <div className="flex flex-col gap-2">
      <div className={cn("flex flex-wrap items-center gap-2 p-2", e.caja)}>
        <code title={link} className={cn("min-w-0 flex-1 basis-40 truncate px-2 font-mono text-xs", e.texto)}>
          {link}
        </code>
        <span className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => copiar(link)}
            aria-label={`Copiar el link de ${TITULO[tipo]}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors [&>svg]:size-3.5",
              e.botonPrimario,
            )}
          >
            <Copy1 />
            Copiar link
          </button>
          <a
            href={base}
            target="_blank"
            rel="noreferrer"
            aria-label={`Probar el link de ${TITULO[tipo]} (se abre en otra pestaña)`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors [&>svg]:size-3.5",
              e.botonSecundario,
            )}
          >
            <ExpandArrowTopRightSquare1 />
            Probar
          </a>
        </span>
      </div>

      {!hostDe(dominio) && (
        <p className={cn("text-xs", e.pista)}>
          Este lanzamiento no tiene landing conectada, así que el link usa la dirección del panel.
        </p>
      )}
    </div>
  );
}

/* ───────────── Dónde lo pusiste ───────────── */

const LUGAR_CORTO: Record<Lugar, string> = {
  "mail-registro": "Mail de registro",
  recordatorios: "Recordatorios",
  "pagina-gracias": "Página de gracias",
  "whatsapp-redes": "WhatsApp o redes",
};

function Lugares({
  modo,
  launchId,
  tipo,
  marcas,
}: {
  modo: ModoEnlaces;
  launchId: string;
  tipo: TipoEnlace;
  marcas: MarcaLugar[];
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const [pendiente, start] = useTransition();
  const [vistas, aplicar] = useOptimistic(marcas, (actuales, cambio: { lugar: Lugar; marcado: boolean }) => {
    const resto = actuales.filter((m) => m.placement !== cambio.lugar);
    return cambio.marcado
      ? [...resto, { link: tipo, placement: cambio.lugar, checked_by: null, checked_at: new Date().toISOString() }]
      : resto;
  });

  function alternar(lugar: Lugar, marcado: boolean) {
    start(async () => {
      aplicar({ lugar, marcado });
      try {
        const r =
          modo.tipo === "panel"
            ? await marcarLugarPanel(launchId, tipo, lugar, marcado)
            : await marcarLugarPortal(modo.slug, launchId, tipo, lugar, marcado);
        if (r?.error) toast.error(r.error);
      } catch {
        toast.error(segun(modo, "No se pudo guardar: recarga la página e intenta de nuevo", "No se pudo guardar: recargá la página y probá de nuevo"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("text-xs font-medium", e.suave)}>Dónde lo pusiste</p>
      <div className="flex flex-wrap gap-2">
        {LUGARES.map((l) => {
          const marca = vistas.find((m) => m.placement === l.slug);
          const marcado = Boolean(marca);
          return (
            <button
              key={l.slug}
              type="button"
              aria-pressed={marcado}
              disabled={pendiente}
              title={marca ? textoMarca(marca) : l.etiqueta}
              onClick={() => alternar(l.slug, !marcado)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                e.chip,
                marcado ? e.chipOn : e.chipOff,
              )}
            >
              {marcado && (
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8.5l3.2 3.2L13 4.8" />
                </svg>
              )}
              {LUGAR_CORTO[l.slug]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── Destino del webinar ───────────── */

/**
 * Destino del webinar en una sola fila: campo + Guardar. Lo usan el portal
 * (cliente) y el panel; cambia solo la action y los campos ocultos.
 */
export function FilaDestinoWebinar({
  modo,
  action,
  campos,
  url,
}: {
  modo: ModoEnlaces;
  action: (formData: FormData) => Promise<unknown>;
  campos: Record<string, string>;
  url: string | null;
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const form = useZodForm({ action, successMessage: "Link del webinar guardado" });
  return (
    <form onSubmit={form.onSubmit} className="flex flex-col gap-2">
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="webinar_url"
          type="url"
          aria-label="Link del webinar (YouTube o Zoom)"
          defaultValue={url ?? ""}
          placeholder="Link de YouTube o Zoom"
          className={cn("min-w-0 flex-1 basis-48", e.input)}
        />
        <button
          type="submit"
          disabled={form.pending}
          className={cn("rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:opacity-60", e.botonSecundario)}
        >
          {form.pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <FormError message={form.formError} />
    </form>
  );
}

/** El cliente edita desde acá a dónde manda el link del webinar (YouTube, Zoom…). */
export function DestinoWebinar({ slug, launchId, url }: { slug: string; launchId: string; url: string | null }) {
  return (
    <FilaDestinoWebinar
      modo={{ tipo: "portal", slug }}
      action={guardarWebinarPortal}
      campos={{ slug, launch_id: launchId }}
      url={url}
    />
  );
}
