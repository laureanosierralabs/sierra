import { BarChart2, CalendarTime, Download1, Eye, UserMultiple1 } from "@tailgrids/icons";
import { BarChartCard } from "@/components/common/charts/bar-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { KpiCard } from "@/components/common/kpi-card";
import { RegistrosTabla } from "@/components/lanzamientos/registros-tabla";
import { Card } from "@/components/tailgrids/core/card";
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import {
  compararVariantes,
  conversion,
  resumirRegistros,
  resumirVisitas,
  ritmoHaciaMeta,
} from "@/lib/lanzamientos/tipos";

const SERIE = [{ key: "registros", name: "Registros", color: CHART_COLORS.net }];

const corta = (dia: string) => `${dia.slice(8)}/${dia.slice(5, 7)}`;
const numero = (n: number) => n.toLocaleString("es-AR");
const porcentaje = (p: number | null) => (p === null ? "—" : `${p.toLocaleString("es-AR")}%`);

/**
 * Panel de un lanzamiento: lo que el cliente pide durante el lanzamiento
 * (cuántos entraron, cuántos se registraron, por dónde y quiénes). Lo usan el
 * panel interno y el portal con los mismos datos.
 *
 * Solo muestra lo que tiene fuente verificable: sin el script de visitas
 * instalado, visitantes y conversión figuran como "—", nunca como 0.
 */
export function PanelLanzamiento({
  detalle,
  exportarHref,
}: {
  detalle: DetalleLanzamiento;
  /** Link de descarga CSV de los registros; sin él no se muestra el botón. */
  exportarHref?: string;
}) {
  const { lanzamiento, paginas, registros, visitas, truncado } = detalle;
  const resumen = resumirRegistros(registros);
  const trafico = resumirVisitas(visitas);
  const ritmo = ritmoHaciaMeta(lanzamiento, resumen.total);
  const meta = lanzamiento.goal_registrations;
  const hayVisitas = trafico.total > 0;

  const filas = paginas.map((p) => {
    const reg = resumen.porPagina[p.id] ?? 0;
    const vis = trafico.porPagina[p.id] ?? 0;
    return { ...p, registros: reg, visitantes: vis, cvr: conversion(reg, vis) };
  });
  const nombre = new Map(paginas.map((p) => [p.id, p.name]));

  // Conversión general: solo registros de landings con visitas medidas. Si
  // no, una landing sin script sumaría registros sin sumar visitantes.
  const registrosMedidos = filas.reduce((t, p) => t + (p.visitantes > 0 ? p.registros : 0), 0);

  const comparacion = compararVariantes(
    filas.map((p) => ({ id: p.id, visitantes: p.visitantes, registros: p.registros })),
  );

  // Registros por fuente: solo existen si el formulario manda los UTM.
  const registrosPorFuente = new Map<string, number>();
  for (const r of registros) {
    const fuente = r.utm_source ?? "";
    registrosPorFuente.set(fuente, (registrosPorFuente.get(fuente) ?? 0) + 1);
  }
  const registrosConFuente = registros.some((r) => r.utm_source);

  return (
    <div className="flex flex-col gap-5">
      {truncado && (
        <p className="rounded-lg bg-badge-warning-background px-3 py-2 text-xs text-badge-warning-text">
          Se muestran los {numero(registros.length)} registros más recientes; los totales son
          parciales.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Visitantes"
          value={hayVisitas ? numero(trafico.total) : "—"}
          hint={hayVisitas ? "Únicos por día" : "Sin script de visitas instalado"}
          icon={<Eye />}
          tone="blue"
        />
        <KpiCard
          label="Registros"
          value={numero(resumen.total)}
          hint={`${numero(resumen.hoy)} hoy`}
          icon={<UserMultiple1 />}
          tone="primary"
        />
        <KpiCard
          label="Conversión"
          value={porcentaje(conversion(registrosMedidos, trafico.total))}
          hint={hayVisitas ? "Registros sobre visitantes únicos diarios" : "Necesita las visitas"}
          icon={<BarChart2 />}
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
                  ? `A este ritmo llega a ${numero(ritmo.proyeccion)}: faltan ${numero(ritmo.faltan)}`
                  : `A este ritmo llega a ${numero(ritmo.proyeccion)}: se cumple`
                : `de ${numero(meta)} registros`
          }
          icon={<CalendarTime />}
          tone={ritmo && ritmo.faltan > 0 ? "warning" : "violet"}
        />
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
            <p className="text-sm text-text-tertiary">Visitantes, registros y conversión</p>
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
                    <span className="text-xs text-text-tertiary tabular-nums">
                      {p.visitantes > 0 ? `${numero(p.visitantes)} visitantes` : "Sin visitas"} ·{" "}
                      {p.mailerlite_group_id ? `${numero(p.registros)} registros` : "sin grupo conectado"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-text-primary tabular-nums">
                      {porcentaje(p.cvr)}
                    </span>
                    <span className="text-xs text-text-tertiary">conversión</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {comparacion && (
            <p className="border-t border-card-border px-5 py-3 text-xs text-text-secondary">
              {comparacion.significativa ? (
                <>
                  <strong className="font-medium text-text-primary">
                    {nombre.get(comparacion.mejor)}
                  </strong>{" "}
                  convierte mejor que {nombre.get(comparacion.segunda)} y la diferencia es consistente
                  (95% de confianza).
                </>
              ) : (
                <>
                  Todavía no hay una ganadora: la diferencia entre {nombre.get(comparacion.mejor)} y{" "}
                  {nombre.get(comparacion.segunda)} puede ser casualidad. Hace falta más tráfico.
                </>
              )}
            </p>
          )}
        </Card>
      </div>

      {hayVisitas && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-card-border px-5 py-4">
            <h2 className="text-base font-semibold text-text-primary">Por fuente</h2>
            <p className="text-sm text-text-tertiary">
              De dónde viene el tráfico, según el utm_source de cada visita
            </p>
          </div>
          <ul className="divide-y divide-card-border">
            {trafico.porFuente.map((f) => {
              const reg = registrosPorFuente.get(f.fuente) ?? 0;
              return (
                <li key={f.fuente || "sin-utm"} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-text-primary">
                    {f.fuente || "Sin UTM (directo u orgánico)"}
                  </span>
                  <span className="flex shrink-0 items-center gap-5 text-sm tabular-nums">
                    <span className="text-text-secondary">{numero(f.visitantes)} visitantes</span>
                    {registrosConFuente && (
                      <>
                        <span className="text-text-secondary">{numero(reg)} registros</span>
                        <span className="w-14 text-right font-semibold text-text-primary">
                          {porcentaje(conversion(reg, f.visitantes))}
                        </span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          {!registrosConFuente && (
            <p className="border-t border-card-border px-5 py-3 text-xs text-text-tertiary">
              Los registros todavía no traen su fuente: el formulario tiene que tener los campos
              utm_source, utm_medium, utm_campaign y utm_content para que el script los complete.
            </p>
          )}
        </Card>
      )}

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
