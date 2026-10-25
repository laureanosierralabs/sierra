"use client";

import { useMemo, useState } from "react";
import { BarraHerramientas } from "@/components/portal/resultados/barra-herramientas";
import { diaCorto, numero, TARJETA, COLOR_REGISTROS, COLOR_VISITAS } from "@/components/portal/resultados/formato";
import { GraficoVentas, GraficoVisitasRegistros } from "@/components/portal/resultados/graficos";
import { FilaKpis } from "@/components/portal/resultados/kpis";
import { BloquePorLanding, BloqueVentas } from "@/components/portal/resultados/landings-ventas";
import { TarjetaEmbudo, TarjetaMeta } from "@/components/portal/resultados/meta-embudo";
import { BloqueOrigen } from "@/components/portal/resultados/origen";
import { SeccionPortal } from "@/components/portal/portal-ui";
import { descargar, ExportarRegistros } from "@/components/lanzamientos/exportar-registros";
import { IngresosWebinar } from "@/components/lanzamientos/ingresos-webinar";
import { RegistrosTabla } from "@/components/lanzamientos/registros-tabla";
import { slugify } from "@/lib/escritura";
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import { construirPromptIA } from "@/lib/lanzamientos/prompt-ia";
import { calcularResultados, OPCIONES_PERIODO, type PeriodoResultados, type PuntoDia } from "@/lib/lanzamientos/resultados";
import { diaDe } from "@/lib/lanzamientos/tipos";
import { COLUMNAS_POR_DEFECTO, csvRegistros } from "@/lib/lanzamientos/vista";
import { cn } from "@/utils/cn";

function Leyenda({ color, nombre, total }: { color: string; nombre: string; total?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-white/75">
      <span aria-hidden="true" className="h-1 w-4 rounded-full" style={{ background: color }} />
      {nombre}
      {total !== undefined && <strong className="font-semibold text-white tabular-nums">{numero(total)}</strong>}
    </span>
  );
}

function VacioGrafico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center px-4 text-center text-sm leading-relaxed text-white/60">{children}</div>
  );
}

/** Texto que lee un lector de pantalla en lugar del gráfico. */
function resumenSerie(serie: PuntoDia[], campo: "visitantes" | "registros" | "ventas", nombre: string) {
  if (serie.length === 0) return `${nombre}: sin datos.`;
  const total = serie.reduce((t, d) => t + d[campo], 0);
  const mejor = serie.reduce((m, d) => (d[campo] > m[campo] ? d : m), serie[0]);
  return `${nombre} por día, del ${diaCorto(serie[0].dia)} al ${diaCorto(serie[serie.length - 1].dia)}: ${numero(total)} en total${
    mejor[campo] > 0 ? `; el mejor día fue el ${diaCorto(mejor.dia)} con ${numero(mejor[campo])}` : ""
  }.`;
}

/**
 * Resultados de un lanzamiento en el portal del cliente. Dos filtros arriba
 * (período y landing) gobiernan todo lo de abajo. Cada número sale de
 * `calcularResultados`, la misma función que arma el prompt para IA.
 */
export function ResultadosPortal({
  detalle,
  ahoraIso,
  reporteHref,
  fechas,
}: {
  detalle: DetalleLanzamiento;
  /** Instante del servidor: así "hoy" no cambia entre el servidor y el navegador. */
  ahoraIso: string;
  reporteHref: string;
  fechas: string | null;
}) {
  const [periodo, setPeriodo] = useState<PeriodoResultados>("todo");
  const [landingId, setLandingId] = useState<string | null>(null);
  const [verRegistros, setVerRegistros] = useState(false);

  const ahora = useMemo(() => new Date(ahoraIso), [ahoraIso]);
  const r = useMemo(
    () => calcularResultados(detalle, { periodo, landingId, ahora }),
    [detalle, periodo, landingId, ahora],
  );
  const { paginas, lanzamiento } = detalle;
  const hayActividad = r.serie.some((d) => d.visitantes > 0 || d.registros > 0);
  const hayVentasEnSerie = r.serie.some((d) => d.ventas > 0);
  const registros = r.datos.registros;
  const etiquetaPeriodo = OPCIONES_PERIODO.find((o) => o.valor === periodo)?.etiqueta ?? "Todo";

  const nombreArchivo = () =>
    [slugify(lanzamiento.name) || "lanzamiento", r.landing ? slugify(r.landing.name) : null, periodo === "todo" ? null : slugify(etiquetaPeriodo)]
      .filter(Boolean)
      .join("-");

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <div className="flex flex-col gap-4">
        <BarraHerramientas
          periodo={periodo}
          onPeriodo={setPeriodo}
          paginas={paginas}
          landingId={landingId}
          onLanding={setLandingId}
          obtenerPrompt={() => construirPromptIA(r, { lanzamiento: lanzamiento.name, fechas, hoy: diaDe(ahora) })}
          onCsv={() => descargar(csvRegistros(registros, COLUMNAS_POR_DEFECTO, paginas), `registros-${nombreArchivo()}.csv`)}
          csvDeshabilitado={registros.length === 0}
          reporteHref={reporteHref}
        />
        {r.truncado && (
          <p className="rounded-xl bg-amber-300/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-300/20">
            Se muestran los {numero(detalle.registros.length)} registros más recientes; los totales son parciales.
          </p>
        )}
        <FilaKpis r={r} />
      </div>

      <SeccionPortal titulo="Visitas y registros por día">
        <div className={cn(TARJETA, "p-4 sm:p-6")}>
          {!hayActividad ? (
            <VacioGrafico>
              Cuando entren visitas y registros verás aquí cómo evolucionan día a día, con el detalle al pasar el cursor.
            </VacioGrafico>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                {r.hayVisitas && (
                  <Leyenda color={COLOR_VISITAS} nombre="Visitantes" total={r.serie.reduce((t, d) => t + d.visitantes, 0)} />
                )}
                <Leyenda color={COLOR_REGISTROS} nombre="Registros" total={r.serie.reduce((t, d) => t + d.registros, 0)} />
              </div>
              <GraficoVisitasRegistros
                serie={r.serie}
                conVisitas={r.hayVisitas}
                resumen={`${resumenSerie(r.serie, "registros", "Registros")} ${r.hayVisitas ? resumenSerie(r.serie, "visitantes", "Visitantes") : ""}`}
              />
              {r.hayVisitas && (
                <p className="mt-3 text-xs text-white/45">
                  Las visitas se leen en la escala de la izquierda y los registros en la de la derecha.
                </p>
              )}
              {r.serieAmpliada && (
                <p className="mt-1 text-xs text-white/45">Los números de arriba son de hoy; el gráfico muestra los últimos 7 días para dar contexto.</p>
              )}
            </>
          )}
        </div>
      </SeccionPortal>

      {hayVentasEnSerie && (
        <SeccionPortal titulo="Ventas por día">
          <div className={cn(TARJETA, "p-4 sm:p-6")}>
            <GraficoVentas serie={r.serie} resumen={resumenSerie(r.serie, "ventas", "Ventas")} />
          </div>
        </SeccionPortal>
      )}

      {r.meta && (
        <SeccionPortal titulo="Meta">
          <TarjetaMeta r={r} />
        </SeccionPortal>
      )}

      <SeccionPortal titulo="Embudo">
        <TarjetaEmbudo r={r} />
      </SeccionPortal>

      {detalle.despues && detalle.despues.webinar.length > 0 && (
        <SeccionPortal titulo="Webinar">
          <IngresosWebinar registros={detalle.registros} webinar={detalle.despues.webinar} lanzamiento={lanzamiento.name} paginas={paginas} />
        </SeccionPortal>
      )}

      <SeccionPortal titulo="Origen">
        <BloqueOrigen r={r} />
      </SeccionPortal>

      {r.porLanding.length > 1 && (
        <SeccionPortal titulo="Por landing">
          <BloquePorLanding r={r} onElegir={setLandingId} />
        </SeccionPortal>
      )}

      {(r.datos.compras.length > 0 || r.actual.tipoConversion === "venta") && (
        <SeccionPortal titulo="Ventas">
          <BloqueVentas r={r} />
        </SeccionPortal>
      )}

      <SeccionPortal
        titulo="Registros"
        accion={
          registros.length > 0 ? (
            <button
              type="button"
              aria-expanded={verRegistros}
              onClick={() => setVerRegistros((v) => !v)}
              className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/10 transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {verRegistros ? "Ocultar" : `Ver los ${numero(registros.length)}`}
            </button>
          ) : undefined
        }
      >
        {registros.length === 0 ? (
          <p className={cn(TARJETA, "p-5 text-sm leading-relaxed text-white/60 sm:p-6")}>
            Cuando alguien se registre, verás aquí su nombre, su contacto y de dónde llegó.
          </p>
        ) : verRegistros ? (
          <RegistrosTabla
            registros={registros}
            paginas={paginas}
            mostrarLanding={!r.landing}
            acciones={
              <ExportarRegistros
                registros={registros}
                paginas={paginas}
                lanzamiento={lanzamiento.name}
                landing={r.landing?.name ?? null}
                periodo={periodo === "todo" ? null : etiquetaPeriodo}
              />
            }
          />
        ) : (
          <p className="text-sm text-white/60">
            {numero(registros.length)} {registros.length === 1 ? "persona se registró" : "personas se registraron"} {periodo === "hoy" ? "hoy" : `en ${r.periodoLargo}`}. Ábrelos para
            buscar, ordenar o exportar con las columnas que elijas.
          </p>
        )}
      </SeccionPortal>
    </div>
  );
}
