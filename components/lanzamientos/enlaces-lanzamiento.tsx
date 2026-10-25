"use client";

import Link from "next/link";
import { useId, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { Copy1, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { FormError } from "@/components/common/form/form-error";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { estilosEnlaces, type EstilosEnlaces } from "@/components/lanzamientos/enlaces-estilos";
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
  /** Destino del webinar, para el resumen del paso 1. */
  url?: string | null;
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
  ninguna: "Otro",
};

/** "¿Con qué envías tus correos?": se muestra dentro del paso 2 y vale para los dos links. */
export function SelectorHerramienta({ modo }: { modo: ModoEnlaces }) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const [herramienta, setHerramienta] = useHerramienta();
  const variable = variableDe(herramienta);
  return (
    <div className="flex flex-col gap-2">
      <p className={cn("text-xs font-medium", e.suave)}>
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
          : segun(
              modo,
              "Sin variable no sabremos quién entró. Úsalo en WhatsApp, redes o donde no tengas el email del contacto.",
              "Sin variable no sabremos quién entró. Usalo en WhatsApp, redes o donde no tengas el email del contacto.",
            )}
      </p>
    </div>
  );
}

/** Explicación de arriba de la pestaña: qué es esto y los tres pasos, en una mirada. */
export function IntroEnlaces({ modo }: { modo: ModoEnlaces }) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const pasos = [
    segun(modo, "Dinos dónde es tu webinar y cuáles son tus grupos.", "Decinos dónde es el webinar y cuáles son los grupos."),
    segun(modo, "Copia tu link y pégalo en tus correos.", "Copiá el link y pegalo en los correos."),
    segun(
      modo,
      "Cuando la gente lo use, lo verás aquí y en Resultados.",
      "Cuando la gente lo use, lo vas a ver acá y en Resultados.",
    ),
  ];
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className={cn("text-sm", e.texto)}>
        {segun(
          modo,
          "Cada link lleva a tu gente a un lugar y cuenta quién entró. Se pega una sola vez: no cambia nunca.",
          "Cada link lleva a la gente a un lugar y cuenta quién entró. Se pega una sola vez: no cambia nunca.",
        )}
      </p>
      <ol className="grid gap-2 sm:grid-cols-3">
        {pasos.map((texto, i) => (
          <li key={texto} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", e.badgeFuturo)}
            >
              {i + 1}
            </span>
            <span className={cn("text-sm", e.suave)}>{texto}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────── Bloque ───────────── */

const PROPOSITO: Record<TipoEnlace, string> = {
  webinar: "Para que tus registrados entren al webinar en vivo y sepas quién se conectó.",
  grupo:
    "Para repartir a tus registrados en grupos de WhatsApp: cuando uno se llena, el link manda solo al siguiente.",
};

const PROPOSITO_PANEL: Record<TipoEnlace, string> = {
  webinar: "Para que los registrados entren al webinar en vivo y saber quién se conectó.",
  grupo:
    "Para repartir a los registrados en grupos de WhatsApp: cuando uno se llena, el link manda solo al siguiente.",
};

type EstadoPaso = "hecho" | "actual" | "futuro";

const Check = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    viewBox="0 0 16 16"
    className={cn("size-3.5", className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 8.5l3.2 3.2L13 4.8" />
  </svg>
);

/** Un paso del recorrido: número (o tilde), línea que lo une con el siguiente y su contenido. */
function Paso({
  e,
  numero,
  estado,
  titulo,
  ultimo,
  children,
}: {
  e: EstilosEnlaces;
  numero: number;
  estado: EstadoPaso;
  titulo: string;
  ultimo?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3" aria-current={estado === "actual" ? "step" : undefined}>
      <div className="flex flex-col items-center">
        <span
          aria-hidden
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            estado === "actual" ? e.badgeActual : estado === "hecho" ? e.badgeHecho : e.badgeFuturo,
          )}
        >
          {estado === "hecho" ? <Check /> : numero}
        </span>
        {!ultimo && <span aria-hidden className={cn("my-1 w-px flex-1", e.linea)} />}
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-3", ultimo ? "pb-0" : "pb-6")}>
        <h4 className={cn("flex min-h-7 items-center text-sm font-bold", estado === "futuro" ? e.suave : e.titulo)}>
          <span className="sr-only">{`Paso ${numero}: `}</span>
          {titulo}
        </h4>
        {children}
      </div>
    </li>
  );
}

/**
 * Un enlace del lanzamiento (webinar o grupo) como tarjeta guiada en tres pasos:
 * 1) decir adónde manda, 2) copiar el link y pegarlo, 3) comprobar que funciona.
 * El link es estable: siempre manda al destino actual, así que cambiarlo no
 * obliga a tocar los correos. La herramienta de correo se elige una vez (paso 2).
 */
export function BloqueEnlace({
  modo,
  launchId,
  tipo,
  dominio,
  ahoraIso,
  datos,
  lineaClave,
  hrefResultados,
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
  /** Adónde lleva "Ver en Resultados"; sin esto, no se muestra el link. */
  hrefResultados?: string;
  /** Editor del paso 1 (link del webinar o grupos). */
  children?: React.ReactNode;
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const [editando, setEditando] = useState(false);
  const [urlVista, setUrlVista] = useState(datos.url ?? null);
  // Al guardarse un destino nuevo, el formulario se vuelve a plegar.
  if ((datos.url ?? null) !== urlVista) {
    setUrlVista(datos.url ?? null);
    setEditando(false);
  }

  const resumen = resumenEnlace({
    tieneDestino: datos.tieneDestino,
    usos: datos.usos,
    ultimoUso: datos.ultimoUso,
    ahoraIso,
  });
  const funcionando = resumen.estado === "funcionando";
  const paso = !datos.tieneDestino ? 1 : funcionando ? 3 : datos.marcas.length > 0 ? 3 : 2;
  const estadoDe = (n: number): EstadoPaso => (funcionando || n < paso ? "hecho" : n === paso ? "actual" : "futuro");
  const proposito = modo.tipo === "portal" ? PROPOSITO[tipo] : PROPOSITO_PANEL[tipo];

  const hostWebinar = tipo === "webinar" ? hostDe(datos.url) : null;
  // El webinar se pliega a una línea cuando ya tiene destino; los grupos se resumen solos.
  const plegable = tipo === "webinar" && datos.tieneDestino;
  const linea = lineaClave ?? lineaDeUsos(datos, tipo, ahoraIso);

  return (
    <section aria-label={TITULO[tipo]} className={cn("flex min-w-0 flex-col gap-5", e.tarjeta)}>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 className={cn("text-base font-bold", e.titulo)}>{TITULO[tipo]}</h3>
          {funcionando ? (
            <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", e.estadoTexto.ok)}>
              <Check />
              Funcionando
            </span>
          ) : (
            <span className={cn("text-xs font-semibold tabular-nums", e.suave)}>Paso {paso} de 3</span>
          )}
        </div>
        <p className={cn("text-sm", e.suave)}>{proposito}</p>
      </div>

      <ol className="flex flex-col">
        <Paso
          e={e}
          numero={1}
          estado={estadoDe(1)}
          titulo={
            tipo === "webinar"
              ? segun(modo, "¿Dónde es tu webinar?", "¿Dónde es el webinar?")
              : segun(modo, "Carga los links de tus grupos", "Cargá los links de los grupos")
          }
        >
          {plegable && !editando && (
            <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", e.texto)}>
              <span className="min-w-0 truncate">
                <span aria-hidden className={e.estadoTexto.ok}>
                  ✓{" "}
                </span>
                Se transmite en <span className="font-semibold">{hostWebinar ?? "tu link"}</span>
              </span>
              <button
                type="button"
                aria-expanded={false}
                onClick={() => setEditando(true)}
                className={cn("text-xs font-medium", e.enlace)}
              >
                Cambiar
              </button>
            </div>
          )}
          {(!plegable || editando) && children}
          {plegable && editando && (
            <button
              type="button"
              aria-expanded
              onClick={() => setEditando(false)}
              className={cn("self-start text-xs font-medium", e.enlace)}
            >
              Cancelar
            </button>
          )}
        </Paso>

        <Paso
          e={e}
          numero={2}
          estado={estadoDe(2)}
          titulo={segun(modo, "Copia tu link y pégalo en tus correos", "Copiá el link y pegalo en los correos")}
        >
          <PasoCopiar modo={modo} tipo={tipo} token={datos.token} dominio={dominio} habilitado={datos.tieneDestino} />
          <Lugares modo={modo} launchId={launchId} tipo={tipo} marcas={datos.marcas} habilitado={datos.tieneDestino} />
        </Paso>

        <Paso e={e} numero={3} estado={estadoDe(3)} titulo={segun(modo, "Comprueba que funciona", "Comprobá que funciona")} ultimo>
          {funcionando ? (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className={cn("text-sm font-medium tabular-nums", e.texto)}>{linea}</p>
              {hrefResultados && (
                <Link href={hrefResultados} scroll={false} className={cn("text-sm font-medium", e.enlace)}>
                  Ver en Resultados
                </Link>
              )}
            </div>
          ) : (
            <p className={cn("text-sm", e.suave)}>
              {datos.tieneDestino
                ? segun(
                    modo,
                    "Envíate el correo de prueba y toca el botón. En segundos verás aquí ✓ Funcionando.",
                    "Enviate el correo de prueba y tocá el botón. En segundos vas a ver acá ✓ Funcionando.",
                  )
                : segun(modo, "Primero completa el paso 1.", "Primero completá el paso 1.")}
            </p>
          )}
          <BotonProbar modo={modo} tipo={tipo} token={datos.token} dominio={dominio} habilitado={datos.tieneDestino} />
        </Paso>
      </ol>
    </section>
  );
}

/** Cuántos usos hubo y cuándo fue el último. */
function lineaDeUsos(d: DatosBloque, tipo: TipoEnlace, ahoraIso: string): string {
  const n = d.usos.toLocaleString("es-AR");
  const cuando = haceCuanto(d.ultimoUso, ahoraIso);
  const quienes =
    tipo === "webinar"
      ? `${n} ${d.usos === 1 ? "persona entró" : "personas entraron"}`
      : `${n} ${d.usos === 1 ? "persona enviada" : "personas enviadas"} a un grupo`;
  return `${quienes}${cuando ? ` · la última ${cuando}` : ""}`;
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

/** El origen se lee en el navegador: así sirve igual en local, preview y producción. */
function useOrigen() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

function PasoCopiar({
  modo,
  tipo,
  token,
  dominio,
  habilitado,
}: {
  modo: ModoEnlaces;
  tipo: TipoEnlace;
  token: string;
  dominio: string | null;
  habilitado: boolean;
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const [herramienta] = useHerramienta();
  const idAyuda = useId();
  const origen = useOrigen();
  const link = linkCompartir(linkBase(tipo, token, dominio, origen || "https://…"), herramienta);

  return (
    <div className="flex flex-col gap-3">
      <SelectorHerramienta modo={modo} />

      <div className="flex flex-col gap-2">
        <div
          className={cn("flex flex-col gap-2 p-2 sm:flex-row sm:items-center", e.caja, !habilitado && "opacity-60")}
        >
          <code title={link} className={cn("min-w-0 flex-1 truncate px-2 font-mono text-xs", e.texto)}>
            {link}
          </code>
          <button
            type="button"
            aria-disabled={!habilitado}
            aria-describedby={habilitado ? undefined : idAyuda}
            onClick={() => habilitado && copiar(link)}
            aria-label={`Copiar el link de ${TITULO[tipo]}`}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors [&>svg]:size-4",
              habilitado ? e.botonPrimario : cn("cursor-not-allowed", e.botonSecundario),
            )}
          >
            <Copy1 />
            Copiar link
          </button>
        </div>
        {!habilitado && (
          <p id={idAyuda} className={cn("text-xs", e.pista)}>
            {segun(modo, "Primero completa el paso 1.", "Primero completá el paso 1.")}
          </p>
        )}
        {!hostDe(dominio) && (
          <p className={cn("text-xs", e.pista)}>
            Este lanzamiento no tiene landing conectada, así que el link usa la dirección del panel.
          </p>
        )}
      </div>
    </div>
  );
}

/** "Probar link": abre el link sin variable, para ver adónde lleva. */
function BotonProbar({
  modo,
  tipo,
  token,
  dominio,
  habilitado,
}: {
  modo: ModoEnlaces;
  tipo: TipoEnlace;
  token: string;
  dominio: string | null;
  habilitado: boolean;
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const origen = useOrigen();
  const base = linkBase(tipo, token, dominio, origen || "https://…");
  const clases = cn(
    "inline-flex items-center gap-1.5 self-start rounded-lg px-4 py-2 text-xs font-bold transition-colors [&>svg]:size-3.5",
    e.botonSecundario,
  );
  if (!habilitado) {
    return (
      <span aria-disabled="true" className={cn(clases, "cursor-not-allowed opacity-50")}>
        <ExpandArrowTopRightSquare1 />
        Probar link
      </span>
    );
  }
  return (
    <a
      href={base}
      target="_blank"
      rel="noreferrer"
      aria-label={`Probar el link de ${TITULO[tipo]} (se abre en otra pestaña)`}
      className={clases}
    >
      <ExpandArrowTopRightSquare1 />
      Probar link
    </a>
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
  habilitado,
}: {
  modo: ModoEnlaces;
  launchId: string;
  tipo: TipoEnlace;
  marcas: MarcaLugar[];
  habilitado: boolean;
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
    <div className={cn("flex flex-col gap-2", !habilitado && "opacity-60")}>
      <p className={cn("text-xs font-medium", e.suave)}>¿Dónde lo pegaste? (opcional)</p>
      <div className="flex flex-wrap gap-2">
        {LUGARES.map((l) => {
          const marca = vistas.find((m) => m.placement === l.slug);
          const marcado = Boolean(marca);
          return (
            <button
              key={l.slug}
              type="button"
              aria-pressed={marcado}
              disabled={pendiente || !habilitado}
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
