"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle1, ClockThree, Wallet2 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { FiltroSelect } from "@/components/landing/filtro-select";
import { EstadoPagoPill } from "@/components/landing/ui";
import { Card } from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import type { MiAcuerdo } from "@/lib/landing/mis-cobros";
import {
  ESTADOS_FILTRO,
  SIN_FILTROS,
  filtrarAcuerdos,
  opcionesDeFiltro,
  pendienteDe,
  totalesPorMoneda,
  type EstadoFiltro,
  type Filtros,
} from "@/lib/landing/mis-cobros-vista";
import { codigoAcuerdo, fechaCorta, formatearMonto } from "@/lib/landing/tipos";
import { duracionTexto } from "@/lib/horas/tipos";

/** Pagos que se ven de entrada; el resto, al desplegar. */
const PAGOS_VISIBLES = 3;

/** Un acuerdo: lo acordado, lo cobrado, lo pendiente y los pagos recibidos. */
function TarjetaAcuerdo({ acuerdo: a }: { acuerdo: MiAcuerdo }) {
  const [todosLosPagos, setTodosLosPagos] = useState(false);
  const pendiente = pendienteDe(a);
  const avance =
    a.total_amount && a.total_amount > 0 ? Math.min(Math.round((a.amount_paid / a.total_amount) * 100), 100) : 0;
  // Los más recientes primero.
  const pagos = [...a.pagos].sort((x, y) => y.paid_on.localeCompare(x.paid_on));
  const visibles = todosLosPagos ? pagos : pagos.slice(0, PAGOS_VISIBLES);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-text-primary">{a.title}</h2>
          <p className="text-xs tabular-nums text-text-tertiary">
            {codigoAcuerdo(a.numero)}
            {a.agreed_on ? ` · acordado el ${fechaCorta(a.agreed_on)}` : ""}
          </p>
        </div>
        <EstadoPagoPill estado={a.payment_status} />
      </div>

      {a.proyectos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {a.proyectos.map((p) => (
            <Link
              key={p.id}
              href={`/landing-pages/projects/${p.id}`}
              className="rounded-md bg-background-gray-secondary px-2 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              {p.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">Trabajo por horas o sin proyecto vinculado</p>
      )}

      <div className="grid grid-cols-3 gap-3 text-sm tabular-nums">
        <div>
          <p className="text-xs text-text-tertiary">Acordado</p>
          <p className="font-semibold text-text-primary">{formatearMonto(a.total_amount, a.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Cobrado</p>
          <p className="font-semibold text-badge-success-text">{formatearMonto(a.amount_paid, a.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Pendiente</p>
          <p className={pendiente > 0 ? "font-semibold text-badge-warning-text" : "text-text-tertiary"}>
            {pendiente > 0 ? formatearMonto(pendiente, a.currency) : "—"}
          </p>
        </div>
      </div>

      {a.total_amount ? <Progress progress={avance} className="max-w-none" /> : null}

      {a.payment_terms && <p className="text-xs text-text-tertiary">Condiciones: {a.payment_terms}</p>}

      <div className="border-t border-card-border pt-3">
        <p className="mb-2 text-xs font-medium text-text-secondary">
          Pagos recibidos{pagos.length > 0 ? ` (${pagos.length})` : ""}
        </p>
        {pagos.length === 0 ? (
          <p className="text-xs text-text-tertiary">Todavía no hay pagos registrados.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-1.5">
              {visibles.map((p) => (
                <li key={p.id} className="flex flex-col gap-0.5 text-sm">
                  <span className="flex items-center justify-between gap-3">
                    <span className="tabular-nums text-text-secondary">
                      {fechaCorta(p.paid_on)}
                      {p.method ? <span className="text-text-tertiary"> · {p.method}</span> : null}
                    </span>
                    <span className="font-medium tabular-nums text-text-primary">
                      {formatearMonto(p.amount, a.currency)}
                    </span>
                  </span>
                  {p.horas && (
                    <Link
                      href={`/landing-pages/horas?mes=${p.horas.desde.slice(0, 7)}`}
                      className="inline-flex items-center gap-1 self-start text-xs text-text-tertiary hover:text-primary-500 [&>svg]:size-3.5"
                    >
                      <ClockThree />
                      {duracionTexto(p.horas.minutos)} cargadas
                      {p.horas.desde === p.horas.hasta
                        ? ` el ${fechaCorta(p.horas.desde)}`
                        : ` del ${fechaCorta(p.horas.desde)} al ${fechaCorta(p.horas.hasta)}`}
                      {" · ver horas"}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {pagos.length > PAGOS_VISIBLES && (
              <button
                type="button"
                onClick={() => setTodosLosPagos((v) => !v)}
                className="mt-2 text-xs font-medium text-primary-500 hover:underline"
              >
                {todosLosPagos ? "Ver menos" : `Ver los ${pagos.length} pagos`}
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/**
 * Mis cobros con filtros: los totales de arriba responden a lo que se filtra,
 * así "¿cuánto me deben de este proyecto?" se contesta con un click.
 */
export function VistaMisCobros({ acuerdos }: { acuerdos: MiAcuerdo[] }) {
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const opciones = opcionesDeFiltro(acuerdos);
  const visibles = filtrarAcuerdos(acuerdos, filtros);
  const totales = totalesPorMoneda(visibles);
  const cambiar = (campo: keyof Filtros) => (valor: string) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const filtrando = filtros.estado !== "todos" || filtros.proyecto !== "todos" || filtros.anio !== "todos";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <FiltroSelect
          etiqueta="Estado"
          valor={filtros.estado}
          onChange={(v) => setFiltros((f) => ({ ...f, estado: v as EstadoFiltro }))}
          todos={{ valor: "todos", etiqueta: "Todos los estados" }}
          opciones={ESTADOS_FILTRO.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta }))}
        />
        {opciones.proyectos.length > 1 && (
          <FiltroSelect
            etiqueta="Proyecto"
            valor={filtros.proyecto}
            onChange={cambiar("proyecto")}
            todos={{ valor: "todos", etiqueta: "Todos los proyectos" }}
            opciones={opciones.proyectos}
          />
        )}
        {opciones.anios.length > 1 && (
          <FiltroSelect
            etiqueta="Año"
            valor={filtros.anio}
            onChange={cambiar("anio")}
            todos={{ valor: "todos", etiqueta: "Todos los años" }}
            opciones={opciones.anios}
          />
        )}
        {filtrando && (
          <button
            type="button"
            onClick={() => setFiltros(SIN_FILTROS)}
            className="text-sm font-medium text-primary-500 hover:underline"
          >
            Quitar filtros
          </button>
        )}
      </div>

      {totales.map((t) => (
        <div key={t.moneda} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label={`Acordado (${t.moneda})`} value={formatearMonto(t.acordado, t.moneda)} icon={<Wallet2 />} tone="primary" />
          <KpiCard label="Cobrado" value={formatearMonto(t.cobrado, t.moneda)} icon={<CheckCircle1 />} tone="success" />
          <KpiCard
            label="Pendiente"
            value={formatearMonto(t.pendiente, t.moneda)}
            icon={<ClockThree />}
            tone={t.pendiente > 0 ? "warning" : "gray"}
          />
        </div>
      ))}

      {visibles.length === 0 ? (
        <EmptyState title="Ningún acuerdo con esos filtros" />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {visibles.map((a) => (
            <TarjetaAcuerdo key={a.id} acuerdo={a} />
          ))}
        </div>
      )}
    </div>
  );
}
