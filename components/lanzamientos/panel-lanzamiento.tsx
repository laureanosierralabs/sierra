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
import { DespuesDelRegistro } from "@/components/lanzamientos/despues-del-registro";
import { ExportarRegistros } from "@/components/lanzamientos/exportar-registros";
import { IngresosWebinar } from "@/components/lanzamientos/ingresos-webinar";
import { RegistrosTabla } from "@/components/lanzamientos/registros-tabla";
import { Card } from "@/components/tailgrids/core/card";
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import {
  partirAnuncio,
  rankingUtm,
  rankingVentasUtm,
  resumirOrigenes,
  sumarPorMoneda,
  type FilaVentas,
  type RankingUtm,
} from "@/lib/lanzamientos/origen";
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
import {
  filtrarPorLanding,
  filtrarPorPeriodo,
  PERIODOS,
  rangoDePeriodo,
  type Periodo,
  type Rango,
} from "@/lib/lanzamientos/vista";

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

const AVISO_PRECIO_LISTA = "Según precio de lista (sin cupones ni reembolsos)";

/** Alguna venta importada trae el precio de lista, no lo realmente cobrado. */
const hayPrecioDeLista = (compras: Pick<Compra, "list_price">[]) => compras.some((c) => c.list_price);

function ventasPorDia(compras: Pick<Compra, "occurred_at">[]) {
  const dias = new Map<string, number>();
  for (const c of compras) {
    if (c.occurred_at === null) continue;
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
 * Dos filtros, arriba, deciden qué se mira: qué landing (o todas) y qué
 * período (hoy, ayer, 7 o 30 días, o todo el lanzamiento). Todo lo de abajo
 * (números, gráfico, fuentes, tabla y exportación) les obedece.
 * Una landing de venta se mide en ventas; una de registro, en registros.
 *
 * Solo muestra lo que tiene fuente verificable: sin visitas medidas,
 * visitantes y conversión figuran como "—", nunca como 0.
 */
export function PanelLanzamiento({ detalle }: { detalle: DetalleLanzamiento }) {
  const { lanzamiento, paginas, truncado } = detalle;
  const [filtro, setFiltro] = useState(TODAS);
  const [periodo, setPeriodo] = useState<Periodo>("todo");
  const seleccion = paginas.find((p) => p.id === filtro) ?? null;
  const rango = rangoDePeriodo(periodo);
  // Primero el período (vale para todas las landings), después la landing.
  const enPeriodo = filtrarPorPeriodo(detalle, rango);
  const vista = filtrarPorLanding(enPeriodo, seleccion?.id ?? null);
  const esVenta = seleccion?.kind === "venta";

  const resumen = resumirRegistros(vista.registros);
  const trafico = resumirVisitas(vista.visitas);
  const hayVisitas = trafico.total > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {paginas.length > 1 && (
          <FiltroSelect
            etiqueta="Landing"
            valor={filtro}
            onChange={setFiltro}
            todos={{ valor: TODAS, etiqueta: "Todas las landings" }}
            opciones={paginas.map((p) => ({ valor: p.id, etiqueta: p.name }))}
          />
        )}
        <FiltroSelect
          etiqueta="Período"
          valor={periodo}
          onChange={(v) => setPeriodo(v as Periodo)}
          todos={{ valor: "todo", etiqueta: "Todo el lanzamiento" }}
          opciones={PERIODOS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))}
        />
        {seleccion && (
          <span className="text-sm text-text-tertiary">
            Landing de {LABEL_TIPO_LANDING[seleccion.kind].toLowerCase()}
          </span>
        )}
      </div>

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
          registrosTotales={enPeriodo.registros.length}
          visitantes={trafico.total}
          compras={vista.compras}
          rango={rango}
        />
      ) : (
        <ResumenLanzamiento detalle={{ ...detalle, ...enPeriodo }} rango={rango} />
      )}

      {detalle.listas.length > 0 && !esVenta && (
        // Las listas (Zoom, WhatsApp) no traen la fecha de cada persona: el
        // embudo es siempre sobre todo el lanzamiento, y se aclara.
        <Embudo
          registros={filtrarPorLanding(detalle, seleccion?.id ?? null).registros.length}
          listas={detalle.listas}
          landing={seleccion?.id ?? null}
          parcial={detalle.truncado}
          todoElLanzamiento={rango !== null}
        />
      )}

      <DespuesDelRegistro
        despues={detalle.despues}
        registros={vista.registros}
        paginas={paginas}
        paginasFiltradas={vista.paginas}
        rango={rango}
        compras={vista.compras.length}
        lanzamiento={lanzamiento.name}
        landing={seleccion?.name ?? null}
      />

      {detalle.despues && detalle.despues.webinar.length > 0 && (
        <IngresosWebinar registros={detalle.registros} webinar={detalle.despues.webinar} lanzamiento={lanzamiento.name} paginas={paginas} />
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          {esVenta ? (
            <>
            <BarChartCard
              title="Ventas por día"
              data={ventasPorDia(vista.compras).map(([dia, n]) => ({ dia: corta(dia), ventas: n }))}
              xKey="dia"
              series={[{ key: "ventas", name: "Ventas", color: CHART_COLORS.net }]}
              isEmpty={!vista.compras.some((c) => c.occurred_at)}
              emptyMessage={rango ? "Ninguna venta medida en este período." : "Todavía no entró ninguna venta medida."}
            />
            {vista.compras.some((c) => c.occurred_at === null) && (
              <p className="mt-2 text-xs text-text-tertiary">
                {numero(vista.compras.filter((c) => c.occurred_at === null).length)} ventas sin fecha conocida no
                aparecen en el gráfico.
              </p>
            )}
            </>
          ) : (
            <BarChartCard
              title="Registros por día"
              data={resumen.porDia.map((d) => ({ dia: corta(d.dia), registros: d.registros }))}
              xKey="dia"
              series={[{ key: "registros", name: "Registros", color: CHART_COLORS.net }]}
              isEmpty={resumen.total === 0}
              emptyMessage={rango ? "Ningún registro en este período." : "Todavía no entró ningún registro."}
            />
          )}
        </div>
        <div className="xl:col-span-2">
          {seleccion ? (
            <DatosLanding pagina={seleccion} />
          ) : (
            <PorLanding detalle={{ ...detalle, ...enPeriodo }} onElegir={setFiltro} />
          )}
        </div>
      </div>

      {hayVisitas && <PorFuente trafico={trafico} registros={vista.registros} />}

      <PorCampana registros={vista.registros} />

      <VentasPorCampana compras={vista.compras} />

      <SinUtmPorOrigen referrers={vista.referrers ?? []} />

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
              periodo={rango ? (PERIODOS.find((p) => p.valor === periodo)?.etiqueta ?? null) : null}
            />
          ) : undefined
        }
      />
    </div>
  );
}

/** Números de todas las landings (en el período elegido): embudo de registro, meta y ventas. */
function ResumenLanzamiento({ detalle, rango }: { detalle: DetalleLanzamiento; rango: Rango | null }) {
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
          hint={rango ? "En el período" : `${numero(resumen.hoy)} hoy`}
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
        {rango ? (
          // La meta es del lanzamiento entero: en un período se ve el ritmo.
          <KpiCard
            label="Por día"
            value={numero(Math.round(resumen.total / rango.dias))}
            hint={rango.dias === 1 ? "Registros en el día" : `Promedio de ${rango.dias} días`}
            icon={<CalendarTime />}
            tone="violet"
          />
        ) : (
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
        )}
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
              {hayPrecioDeLista(compras) && <p className="text-xs text-text-tertiary">{AVISO_PRECIO_LISTA}</p>}
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
  rango,
}: {
  pagina: PaginaLanzamiento;
  registros: number;
  registrosHoy: number;
  registrosTotales: number;
  visitantes: number;
  compras: Compra[];
  rango: Rango | null;
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
          hint={
            hayPrecioDeLista(compras)
              ? AVISO_PRECIO_LISTA
              : ingresos.length > 1
                ? ingresos.map(([m, t]) => `${m} ${monto(t)}`).join(" · ")
                : "De las ventas medidas"
          }
          icon={<Wallet2 />}
          tone="violet"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpiVisitantes}
      <KpiCard
        label="Registros"
        value={numero(registros)}
        hint={rango ? "En el período" : `${numero(registrosHoy)} hoy`}
        icon={<UserMultiple1 />}
        tone="primary"
      />
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
        hint={rango ? "De los registros del período" : "De los registros del lanzamiento"}
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
  const comprasDePagina = new Map<string, Compra[]>();
  for (const c of compras) {
    if (!c.page_id) continue;
    comprasPorPagina.set(c.page_id, (comprasPorPagina.get(c.page_id) ?? 0) + 1);
    comprasDePagina.set(c.page_id, [...(comprasDePagina.get(c.page_id) ?? []), c]);
  }

  const filas = paginas.map((p) => {
    const vis = trafico.porPagina[p.id] ?? 0;
    const conv = p.kind === "venta" ? (comprasPorPagina.get(p.id) ?? 0) : (resumen.porPagina[p.id] ?? 0);
    const ingresos = p.kind === "venta" ? sumarPorMoneda(comprasDePagina.get(p.id) ?? []) : [];
    return { ...p, visitantes: vis, conversiones: conv, ingresos, cvr: conversion(conv, vis) };
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
                    {p.ingresos.length > 0 && ` · ${p.ingresos.map(([m, t]) => `${m} ${monto(t)}`).join(" + ")}`}
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

/**
 * Lo que pasa después del registro, cruzado con las listas que se subieron
 * (grupo de WhatsApp, asistentes, compradores). Respeta el filtro de landing:
 * así se ve qué landing trae gente que después asiste o compra.
 */
function Embudo({
  registros,
  listas,
  landing,
  parcial,
  todoElLanzamiento,
}: {
  registros: number;
  listas: DetalleLanzamiento["listas"];
  /** Landing filtrada; null = todas. */
  landing: string | null;
  /** Registros leídos hasta el tope: "no se registraron" estaría inflado. */
  parcial: boolean;
  /** Hay un período elegido, pero el embudo no se puede acotar: se aclara. */
  todoElLanzamiento: boolean;
}) {
  const todas = landing === null;
  const pasos = listas.map((l) => ({ ...l, cruzanAca: todas ? l.cruzan : (l.porPagina[landing] ?? 0) }));

  return (
    <Card className="overflow-hidden p-0">
      <CabeceraCard
        titulo="Embudo con listas cargadas"
        detalle={
          (todas
            ? "De los registrados, cuántos siguieron cada paso (cruzado por email o teléfono)"
            : "De los registrados en esta landing, cuántos siguieron cada paso") +
          (todoElLanzamiento ? ". Sobre todo el lanzamiento: las listas no traen fechas." : "")
        }
      />
      <ol className="grid grid-cols-1 divide-y divide-card-border sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] sm:divide-x sm:divide-y-0">
        <li className="px-5 py-4">
          <p className="text-sm text-text-tertiary">Registros</p>
          <p className="text-xl font-semibold text-text-primary tabular-nums">{numero(registros)}</p>
        </li>
        {pasos.map((p) => (
          <li key={p.id} className="px-5 py-4">
            <p className="truncate text-sm text-text-tertiary">{p.name}</p>
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {numero(p.cruzanAca)}{" "}
              <span className="text-sm font-medium text-text-secondary">{porcentaje(conversion(p.cruzanAca, registros))}</span>
            </p>
            {todas && !parcial && p.sinRegistro > 0 && (
              <p className="text-xs text-text-tertiary">+{numero(p.sinRegistro)} que no se registraron por las landings</p>
            )}
          </li>
        ))}
      </ol>
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

/** Cada fila de un ranking: valor tal cual llegó (suele ser un id de Meta), cantidad y parte del total. */
function ListaRanking({ ranking, sinValor }: { ranking: RankingUtm; sinValor: string }) {
  return (
    <ul className="divide-y divide-card-border">
      {ranking.filas.map((f) => (
        <li key={f.valor ?? "sin-valor"} className="flex items-center justify-between gap-4 px-5 py-3">
          <span
            title={f.valor ?? undefined}
            className={
              f.valor === null
                ? "min-w-0 truncate text-sm text-text-tertiary"
                : "min-w-0 truncate font-mono text-xs font-medium text-text-primary"
            }
          >
            {f.valor ?? sinValor}
          </span>
          <span className="flex shrink-0 items-center gap-5 text-sm tabular-nums">
            <span className="text-text-secondary">{numero(f.registros)} registros</span>
            <span className="w-14 text-right font-semibold text-text-primary">{porcentaje(f.porcentaje)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Ventas de cada fila: cantidad, ingreso por moneda y parte del total. */
function ListaVentas({ filas, sinValor, anuncio }: { filas: FilaVentas[]; sinValor: string; anuncio?: boolean }) {
  return (
    <ul className="divide-y divide-card-border">
      {filas.map((f) => {
        const partes = f.valor !== null && anuncio ? partirAnuncio(f.valor) : null;
        return (
          <li key={f.valor ?? "sin-valor"} className="flex items-center justify-between gap-4 px-5 py-3">
            <span className="min-w-0" title={f.valor ?? undefined}>
              <span
                className={
                  f.valor === null
                    ? "block truncate text-sm text-text-tertiary"
                    : "block truncate text-sm font-medium text-text-primary"
                }
              >
                {partes ? partes.nombre : (f.valor ?? sinValor)}
              </span>
              {partes?.id && <span className="block truncate font-mono text-xs text-text-tertiary">{partes.id}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-5 text-sm tabular-nums">
              <span className="text-text-secondary">
                {numero(f.ventas)} {f.ventas === 1 ? "venta" : "ventas"}
                {f.ingresos.length > 0 && ` · ${f.ingresos.map(([m, t]) => `${m} ${monto(t)}`).join(" + ")}`}
              </span>
              <span className="w-14 text-right font-semibold text-text-primary">{porcentaje(f.porcentaje)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Ventas por campaña y por anuncio: de qué anuncio salió cada compra. Solo si alguna trae UTM. */
function VentasPorCampana({ compras }: { compras: DetalleLanzamiento["compras"] }) {
  const campanas = rankingVentasUtm(compras, "utm_campaign");
  const anuncios = rankingVentasUtm(compras, "utm_content");
  if (!campanas.hayValor && !anuncios.hayValor) return null;

  return (
    <Card className="overflow-hidden p-0">
      <CabeceraCard
        titulo="Ventas por campaña y anuncio"
        detalle="Ventas según el utm_campaign y el utm_content de la compra. Del anuncio se muestra el nombre y, debajo, el id de Meta."
      />
      <div className="grid grid-cols-1 divide-y divide-card-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="min-w-0">
          <p className="border-b border-card-border px-5 py-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Ventas por campaña
          </p>
          <ListaVentas filas={campanas.filas} sinValor="Sin campaña" />
        </div>
        <div className="min-w-0">
          <p className="border-b border-card-border px-5 py-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Ventas por anuncio
          </p>
          <ListaVentas filas={anuncios.filas} sinValor="Sin anuncio" anuncio />
        </div>
      </div>
    </Card>
  );
}

/** Registros por campaña y por anuncio (utm_campaign / utm_content), top 10 de cada una. */
function PorCampana({ registros }: { registros: DetalleLanzamiento["registros"] }) {
  const campanas = rankingUtm(registros, "utm_campaign");
  const anuncios = rankingUtm(registros, "utm_content");
  if (!campanas.hayValor && !anuncios.hayValor) return null;

  return (
    <Card className="overflow-hidden p-0">
      <CabeceraCard
        titulo="Por campaña y anuncio"
        detalle="Registros según el utm_campaign y el utm_content (el anuncio de Meta). Suelen ser ids de Meta."
      />
      <div className="grid grid-cols-1 divide-y divide-card-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="min-w-0">
          <p className="border-b border-card-border px-5 py-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Campaña
          </p>
          <ListaRanking ranking={campanas} sinValor="Sin campaña" />
        </div>
        <div className="min-w-0">
          <p className="border-b border-card-border px-5 py-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Anuncio
          </p>
          <ListaRanking ranking={anuncios} sinValor="Sin anuncio" />
        </div>
      </div>
    </Card>
  );
}

/** De dónde llegan las visitas que no traen utm_source, según su referrer. */
function SinUtmPorOrigen({ referrers }: { referrers: NonNullable<DetalleLanzamiento["referrers"]> }) {
  const origenes = resumirOrigenes(referrers);
  if (origenes.length === 0) return null;

  return (
    <Card className="overflow-hidden p-0">
      <CabeceraCard
        titulo="Tráfico sin UTM, por origen"
        detalle="Visitas sin utm_source agrupadas por el sitio desde el que llegaron"
      />
      <ul className="divide-y divide-card-border">
        {origenes.map((o) => (
          <li key={o.origen} className="flex items-center justify-between gap-4 px-5 py-3">
            <span className="min-w-0 truncate text-sm font-medium text-text-primary">{o.origen}</span>
            <span className="shrink-0 text-sm tabular-nums text-text-secondary">
              {numero(o.visitantes)} visitantes
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
