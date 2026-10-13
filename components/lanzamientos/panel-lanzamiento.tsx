import { CalendarTime, Download1, Layers2, UserMultiple1 } from "@tailgrids/icons";
import { BarChartCard } from "@/components/common/charts/bar-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { KpiCard } from "@/components/common/kpi-card";
import { RegistrosTabla } from "@/components/lanzamientos/registros-tabla";
import { Card } from "@/components/tailgrids/core/card";
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import { resumirRegistros, ritmoHaciaMeta } from "@/lib/lanzamientos/tipos";

const SERIE = [{ key: "registros", name: "Registros", color: CHART_COLORS.net }];

/* Con menos registros que esto por landing, comparar variantes es apresurado. */
const MUESTRA_MINIMA = 100;

const corta = (dia: string) => `${dia.slice(8)}/${dia.slice(5, 7)}`;

/**
 * Panel de un lanzamiento: lo que el cliente pide durante el lanzamiento
 * (cuántos entraron, por dónde y quiénes). Lo usan el panel interno y el
 * portal con los mismos datos: no hay una versión "para el cliente" distinta.
 *
 * Solo muestra lo que tiene fuente verificable. Las visitas (y por lo tanto
 * la conversión) no aparecen hasta conectar una fuente de visitas.
 */
export function PanelLanzamiento({
  detalle,
  exportarHref,
}: {
  detalle: DetalleLanzamiento;
  /** Link de descarga CSV de los registros; sin él no se muestra el botón. */
  exportarHref?: string;
}) {
  const { lanzamiento, paginas, registros, truncado } = detalle;
  const resumen = resumirRegistros(registros);
  const ritmo = ritmoHaciaMeta(lanzamiento, resumen.total);
  const meta = lanzamiento.goal_registrations;

  const filas = paginas.map((p) => ({ ...p, registros: resumen.porPagina[p.id] ?? 0 }));
  const comparables = filas.filter((p) => p.mailerlite_group_id);
  const pocaMuestra =
    comparables.length > 1 && comparables.some((p) => p.registros < MUESTRA_MINIMA);

  return (
    <div className="flex flex-col gap-5">
      {truncado && (
        <p className="rounded-lg bg-badge-warning-background px-3 py-2 text-xs text-badge-warning-text">
          Se muestran los {registros.length.toLocaleString("es-AR")} registros más recientes; los
          totales son parciales.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Registros"
          value={resumen.total.toLocaleString("es-AR")}
          icon={<UserMultiple1 />}
          tone="primary"
        />
        <KpiCard
          label="Hoy"
          value={resumen.hoy.toLocaleString("es-AR")}
          icon={<CalendarTime />}
          tone="success"
        />
        <KpiCard
          label="Meta"
          value={meta ? `${Math.round((resumen.total / meta) * 100)}%` : "—"}
          hint={
            !meta
              ? "Sin meta cargada"
              : ritmo
                ? ritmo.faltan > 0
                  ? `A este ritmo llega a ${ritmo.proyeccion.toLocaleString("es-AR")}: faltan ${ritmo.faltan.toLocaleString("es-AR")}`
                  : `A este ritmo llega a ${ritmo.proyeccion.toLocaleString("es-AR")}: se cumple`
                : `de ${meta.toLocaleString("es-AR")} registros`
          }
          icon={<CalendarTime />}
          tone={ritmo && ritmo.faltan > 0 ? "warning" : "primary"}
        />
        <KpiCard label="Landings" value={paginas.length} icon={<Layers2 />} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <BarChartCard
            title="Registros por día"
            data={resumen.porDia.map((d) => ({ dia: corta(d.dia), registros: d.registros }))}
            xKey="dia"
            series={SERIE}
            isEmpty={resumen.total === 0}
            emptyMessage="Todavía no entró ningún registro."
          />
        </div>

        <Card className="overflow-hidden p-0 xl:col-span-2">
          <div className="border-b border-card-border px-5 py-4">
            <h2 className="text-base font-semibold text-text-primary">Por landing</h2>
            <p className="text-sm text-text-tertiary">Registros de cada variante</p>
          </div>
          {filas.length === 0 ? (
            <p className="px-5 py-4 text-sm text-text-tertiary">Todavía no hay landings cargadas.</p>
          ) : (
            <ul className="divide-y divide-card-border">
              {filas.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="min-w-0">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-text-primary hover:underline"
                      >
                        {p.name}
                      </a>
                    ) : (
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {p.name}
                      </span>
                    )}
                    {!p.mailerlite_group_id && (
                      <span className="text-xs text-text-tertiary">Sin grupo conectado: no cuenta registros</span>
                    )}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-text-primary tabular-nums">
                      {p.registros.toLocaleString("es-AR")}
                    </span>
                    <span className="text-xs text-text-tertiary tabular-nums">
                      {resumen.total > 0 ? `${Math.round((p.registros / resumen.total) * 100)}%` : "—"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-1 border-t border-card-border px-5 py-3 text-xs text-text-tertiary">
            <p>Visitas y conversión: sin fuente conectada.</p>
            {pocaMuestra && (
              <p>
                Pocas muestras: con menos de {MUESTRA_MINIMA} registros por landing, la diferencia
                todavía puede ser casualidad.
              </p>
            )}
          </div>
        </Card>
      </div>

      <RegistrosTabla
        registros={registros}
        paginas={paginas}
        acciones={
          exportarHref && registros.length > 0 ? (
            <a
              href={exportarHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-button-primary-outline-stroke px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background-gray-secondary [&>svg]:size-4"
            >
              <Download1 />
              Exportar CSV
            </a>
          ) : undefined
        }
      />
    </div>
  );
}
