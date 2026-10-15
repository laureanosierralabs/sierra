"use client";

import { useState } from "react";
import {
  BarChart2,
  CalendarTime,
  Cart2,
  ExpandArrowTopRightSquare1,
  Eye,
  UserMultiple1,
  Wallet2,
} from "@tailgrids/icons";
import { BarChartCard } from "@/components/common/charts/bar-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { KpiCard } from "@/components/common/kpi-card";
import { FiltroSelect } from "@/components/landing/filtro-select";
import { ExportarRegistros } from "@/components/lanzamientos/exportar-registros";
import { RegistrosTabla } from "@/components/lanzamientos/registros-tabla";
import { Card } from "@/components/tailgrids/core/card";
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import {
  compararVariantes,
  conversion,
  diaDe,
  LABEL_TIPO_LANDING,
  resumirRegistros,
  resumirVisitas,
  ritmoHaciaMeta,
  type Compra,
  type PaginaLanzamiento,
} from "@/lib/lanzamientos/tipos";
import { filtrarPorLanding } from "@/lib/lanzamientos/vista";

const TODAS = "todas";

/** Ingresos por moneda: sumar USD con ARS daría un número sin sentido. */
function ingresosPorMoneda(compras: Pick<Compra, "amount" | "currency">[]) {
  const total = new Map<string, number>();
  for (const c of compras) {
    if (c.amount === null) continue;
    const moneda = c.currency ?? "—";
    total.set(moneda, (total.get(moneda) ?? 0) + c.amount);
  }
  return [...total.entries()];
}

function ventasPorDia(compras: Pick<Compra, "occurred_at">[]) {
  const dias = new Map<string, number>();
  for (const c of compras) {
    const dia = diaDe(c.occurred_at);
    dias.set(dia, (dias.get(dia) ?? 0) + 1);
  }
  return [...dias.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

const corta = (dia: string) => `${dia.slice(8)}/${dia.slice(5, 7)}`;
const numero = (n: number) => n.toLocaleString("es-AR");
const porcentaje = (p: number | null) => (p === null ? "—" : `${p.toLocaleString("es-AR")}%`);
const monto = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

/** Encabezado de una tarjeta de sección: título y una línea de contexto. */
function CabeceraCard({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="border-b border-card-border px-5 py-4">
      <h2 className="text-base font-semibold text-text-primary">{titulo}</h2>
      <p className="text-sm text-text-tertiary">{detalle}</p>
    </div>
  );
}

/**
 * Resultados de un lanzamiento: lo que el cliente pide durante el lanzamiento
 * (cuántos entraron, cuántos se registraron o compraron, por dónde y quiénes).
 * Lo usan el panel interno y el portal con los mismos datos.
 *
 * Un solo filtro, arriba, decide qué se mira: todas las landings o una. Todo
 * lo de abajo (números, gráfico, fuentes, tabla y exportación) le obedece.
 * Una landing de venta se mide en ventas; una de registro, en registros.
 *
 * Solo muestra lo que tiene fuente verificable: sin visitas medidas,
 * visitantes y conversión figuran como "—", nunca como 0.
 */
export function PanelLanzamiento({ detalle }: { detalle: DetalleLanzamiento }) {
  const { lanzamiento, paginas, truncado } = detalle;
  const [filtro, setFiltro] = useState(TODAS);
  const seleccion = paginas.find((p) => p.id === filtro) ?? null;
  const vista = filtrarPorLanding(detalle, seleccion?.id ?? null);
  const esVenta = seleccion?.kind === "venta";

  const resumen = resumirRegistros(vista.registros);
  const trafico = resumirVisitas(vista.visitas);
  const hayVisitas = trafico.total > 0;

  return (
    <div className="flex flex-col gap-5">
      {paginas.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <FiltroSelect
            etiqueta="Landing"
            valor={filtro}
            onChange={setFiltro}
            todos={{ valor: TODAS, etiqueta: "Todas las landings" }}
            opciones={paginas.map((p) => ({ valor: p.id, etiqueta: p.name }))}
          />
          {seleccion && (
            <span className="text-sm text-text-tertiary">
              Landing de {LABEL_TIPO_LANDING[seleccion.kind].toLowerCase()}
            </span>
          )}
        </div>
      )}

      {truncado && (
        <p className="rounded-lg bg-badge-warning-background px-3 py-2 text-xs text-badge-warning-text">
          Se muestran los {numero(detalle.registros.length)} registros más recientes; los totales son
          parciales.
        </p>
      )}

      {seleccion ? (
        <ResumenLanding
          pagina={seleccion}
          registros={resumen.total}
          registrosHoy={resumen.hoy}
          registrosTotales={detalle.registros.length}
          visitantes={trafico.total}
          compras={vista.compras}
        />
      ) : (
        <ResumenLanzamiento detalle={detalle} />
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          {esVenta ? (
            <BarChartCard
              title="Ventas por día"
              data={ventasPorDia(vista.compras).map(([dia, n]) => ({ dia: corta(dia), ventas: n }))}
              xKey="dia"
              series={[{ key: "ventas", name: "Ventas", color: CHART_COLORS.net }]}
              isEmpty={vista.compras.length === 0}
              emptyMessage="Todavía no entró ninguna venta medida."
            />
          ) : (
            <BarChartCard
              title="Registros por día"
              data={resumen.porDia.map((d) => ({ dia: corta(d.dia), registros: d.registros }))}
              xKey="dia"
              series={[{ key: "registros", name: "Registros", color: CHART_COLORS.net }]}
              isEmpty={resumen.total === 0}
              emptyMessage="Todavía no entró ningún registro."
            />
          )}
        </div>
        <div className="xl:col-span-2">
          {seleccion ? (
            <DatosLanding pagina={seleccion} />
          ) : (
            <PorLanding detalle={detalle} onElegir={setFiltro} />
          )}
        </div>
      </div>

      {hayVisitas && <PorFuente trafico={trafico} registros={vista.registros} />}

      <RegistrosTabla
        registros={vista.registros}
        paginas={paginas}
        mostrarLanding={!seleccion}
        acciones={
          vista.registros.length > 0 ? (
            <ExportarRegistros
              registros={vista.registros}
              paginas={paginas}
              lanzamiento={lanzamiento.name}
              landing={seleccion?.name ?? null}
            />
          ) : undefined
        }
      />
    </div>
  );
}

/** Números del lanzamiento completo: embudo de registro, meta y ventas. */
function ResumenLanzamiento({ detalle }: { detalle: DetalleLanzamiento }) {
  const { lanzamiento, paginas, registros, visitas, compras } = detalle;
  const resumen = resumirRegistros(registros);
  const trafico = resumirVisitas(visitas);
  const ritmo = ritmoHaciaMeta(lanzamiento, resumen.total);
  const meta = lanzamiento.goal_registrations;
  const hayVisitas = trafico.total > 0;

  // Conversión de registro: solo landings de registro con visitas medidas.
  // Una de venta (o una sin script) sumaría visitantes que nunca iban a
  // registrarse, o registros sin visitantes.
  const deRegistro = paginas.filter((p) => p.kind !== "venta" && (trafico.porPagina[p.id] ?? 0) > 0);
  const registrosMedidos = deRegistro.reduce((t, p) => t + (resumen.porPagina[p.id] ?? 0), 0);
  const visitantesDeRegistro = deRegistro.reduce((t, p) => t + (trafico.porPagina[p.id] ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Visitantes"
          value={hayVisitas ? numero(trafico.total) : "—"}
          hint={hayVisitas ? "Únicos por día" : "Sin visitas medidas"}
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
          label="Conversión a registro"
          value={porcentaje(conversion(registrosMedidos, visitantesDeRegistro))}
          hint={hayVisitas ? "Registros sobre visitantes de las landings de registro" : "Necesita las visitas"}
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

      {compras.length > 0 && (
        <Card className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-sm font-medium text-text-tertiary">Ventas</p>
            <p className="text-xl font-semibold text-text-primary tabular-nums">{numero(compras.length)}</p>
          </div>
          {ingresosPorMoneda(compras).map(([moneda, total]) => (
            <div key={moneda}>
              <p className="text-sm font-medium text-text-tertiary">Ingresos ({moneda})</p>
              <p className="text-xl font-semibold text-text-primary tabular-nums">{monto(total)}</p>
            </div>
          ))}
          <div>
            <p className="text-sm font-medium text-text-tertiary">Registros que compraron</p>
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {porcentaje(conversion(compras.length, resumen.total))}
            </p>
          </div>
        </Card>
      )}
    </>
  );
}

/** Números de una sola landing, medidos contra lo suyo. */
function ResumenLanding({
  pagina,
  registros,
  registrosHoy,
  registrosTotales,
  visitantes,
  compras,
}: {
  pagina: PaginaLanzamiento;
  registros: number;
  registrosHoy: number;
  registrosTotales: number;
  visitantes: number;
  compras: Compra[];
}) {
  const hayVisitas = visitantes > 0;
  const kpiVisitantes = (
    <KpiCard
      label="Visitantes"
      value={hayVisitas ? numero(visitantes) : "—"}
      hint={hayVisitas ? "Únicos por día" : "Sin visitas medidas"}
      icon={<Eye />}
      tone="blue"
    />
  );

  if (pagina.kind === "venta") {
    const ingresos = ingresosPorMoneda(compras);
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiVisitantes}
        <KpiCard label="Ventas" value={numero(compras.length)} hint="Compras confirmadas" icon={<Cart2 />} tone="primary" />
        <KpiCard
          label="Conversión a venta"
          value={porcentaje(conversion(compras.length, visitantes))}
          hint={hayVisitas ? "Ventas sobre visitantes" : "Necesita las visitas"}
          icon={<BarChart2 />}
          tone="success"
        />
        <KpiCard
          label="Ingresos"
          value={ingresos.length === 1 ? `${ingresos[0][0]} ${monto(ingresos[0][1])}` : ingresos.length ? "Varias monedas" : "—"}
          hint={ingresos.length > 1 ? ingresos.map(([m, t]) => `${m} ${monto(t)}`).join(" · ") : "De las ventas medidas"}
          icon={<Wallet2 />}
          tone="violet"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpiVisitantes}
      <KpiCard label="Registros" value={numero(registros)} hint={`${numero(registrosHoy)} hoy`} icon={<UserMultiple1 />} tone="primary" />
      <KpiCard
        label="Conversión a registro"
        value={porcentaje(conversion(registros, visitantes))}
        hint={hayVisitas ? "Registros sobre visitantes" : "Necesita las visitas"}
        icon={<BarChart2 />}
        tone="success"
      />
      <KpiCard
        label="Del total"
        value={registrosTotales ? `${Math.round((registros / registrosTotales) * 100)}%` : "—"}
        hint="De los registros del lanzamiento"
        icon={<CalendarTime />}
        tone="violet"
      />
    </div>
  );
}

/** Cada landing con su conversión; tocar una la elige en el filtro. */
function PorLanding({
  detalle,
  onElegir,
}: {
  detalle: DetalleLanzamiento;
  onElegir: (id: string) => void;
}) {
  const { paginas, registros, visitas, compras } = detalle;
  const resumen = resumirRegistros(registros);
  const trafico = resumirVisitas(visitas);
  const comprasPorPagina = new Map<string, number>();
  for (const c of compras) {
    if (c.page_id) comprasPorPagina.set(c.page_id, (comprasPorPagina.get(c.page_id) ?? 0) + 1);
  }

  const filas = paginas.map((p) => {
    const vis = trafico.porPagina[p.id] ?? 0;
    const conv = p.kind === "venta" ? (comprasPorPagina.get(p.id) ?? 0) : (resumen.porPagina[p.id] ?? 0);
    return { ...p, visitantes: vis, conversiones: conv, cvr: conversion(conv, vis) };
  });
  const nombre = new Map(paginas.map((p) => [p.id, p.name]));

  // Se comparan landings del mismo tipo: un test A/B es entre variantes.
  const comparaciones = (["registro", "venta"] as const)
    .map((tipo) =>
      compararVariantes(
        filas
          .filter((p) => p.kind === tipo)
          .map((p) => ({ id: p.id, visitantes: p.visitantes, registros: p.conversiones })),
      ),
    )
    .filter((c) => c !== null);

  return (
    <Card className="h-full overflow-hidden p-0">
      <CabeceraCard titulo="Por landing" detalle="Tocá una para ver solo sus datos" />
      {filas.length === 0 ? (
        <p className="px-5 py-4 text-sm text-text-tertiary">Todavía no hay landings cargadas.</p>
      ) : (
        <ul className="divide-y divide-card-border">
          {filas.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onElegir(p.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-background-gray-secondary focus-visible:bg-background-gray-secondary focus-visible:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text-primary">{p.name}</span>
                  <span className="text-xs text-text-tertiary tabular-nums">
                    {p.visitantes > 0 ? `${numero(p.visitantes)} visitantes` : "Sin visitas"} ·{" "}
                    {numero(p.conversiones)} {p.kind === "venta" ? "ventas" : "registros"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold text-text-primary tabular-nums">
                    {porcentaje(p.cvr)}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {p.kind === "venta" ? "a venta" : "a registro"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {comparaciones.map((comparacion) => (
        <p key={comparacion.mejor} className="border-t border-card-border px-5 py-3 text-xs text-text-secondary">
          {comparacion.significativa ? (
            <>
              <strong className="font-medium text-text-primary">{nombre.get(comparacion.mejor)}</strong>{" "}
              convierte mejor que {nombre.get(comparacion.segunda)} y la diferencia es consistente (95% de
              confianza).
            </>
          ) : (
            <>
              Todavía no hay una ganadora: la diferencia entre {nombre.get(comparacion.mejor)} y{" "}
              {nombre.get(comparacion.segunda)} puede ser casualidad. Hace falta más tráfico.
            </>
          )}
        </p>
      ))}
    </Card>
  );
}

/** Links de la landing elegida: a dónde manda a quien se registra o compra. */
function DatosLanding({ pagina }: { pagina: PaginaLanzamiento }) {
  const links = [
    { etiqueta: "Landing", url: pagina.url },
    { etiqueta: "Página de gracias", url: pagina.thanks_url },
    { etiqueta: "Grupo de WhatsApp", url: pagina.whatsapp_url },
    { etiqueta: "Checkout", url: pagina.checkout_url },
  ].filter((l): l is { etiqueta: string; url: string } => Boolean(l.url));

  return (
    <Card className="h-full overflow-hidden p-0">
      <CabeceraCard titulo={pagina.name} detalle={`Landing de ${LABEL_TIPO_LANDING[pagina.kind].toLowerCase()}`} />
      {links.length === 0 ? (
        <p className="px-5 py-4 text-sm text-text-tertiary">Sin links cargados.</p>
      ) : (
        <ul className="divide-y divide-card-border">
          {links.map((l) => (
            <li key={l.etiqueta}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-background-gray-secondary"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-text-primary">{l.etiqueta}</span>
                  <span className="block truncate text-xs text-text-tertiary">
                    {l.url.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                <ExpandArrowTopRightSquare1 className="size-4 shrink-0 text-text-tertiary" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** De dónde viene el tráfico y cuánto convierte cada fuente. */
function PorFuente({
  trafico,
  registros,
}: {
  trafico: ReturnType<typeof resumirVisitas>;
  registros: DetalleLanzamiento["registros"];
}) {
  // Registros por fuente: solo existen si el formulario manda los UTM.
  const registrosPorFuente = new Map<string, number>();
  for (const r of registros) {
    const fuente = r.utm_source ?? "";
    registrosPorFuente.set(fuente, (registrosPorFuente.get(fuente) ?? 0) + 1);
  }
  const registrosConFuente = registros.some((r) => r.utm_source);

  return (
    <Card className="overflow-hidden p-0">
      <CabeceraCard titulo="Por fuente" detalle="De dónde viene el tráfico, según el utm_source de cada visita" />
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
          Los registros todavía no traen su fuente: el formulario tiene que tener los campos utm_source,
          utm_medium, utm_campaign y utm_content para que el script los complete.
        </p>
      )}
    </Card>
  );
}
