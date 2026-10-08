"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/tailgrids/core/button";
import type { FinanceData, FinanceRow } from "@/lib/personal-finance";
import { useFinanceDialogs } from "../editores/dialogos";
import { visibleRow } from "../filtros";
import { Segmentado } from "../segmentado";
import { SEGMENTOS, type EntidadPago, type FinanceQuery, type Segmento } from "../tipos";
import { buildHref } from "../url";
import { HistorialDialog } from "./historial-dialog";
import { ObligationCard } from "./obligation-card";
import { ScheduleCard } from "./schedule-card";
import { VencimientosChart } from "./vencimientos-chart";

interface CompromisosViewProps {
  data: FinanceData;
  seg: Segmento;
  query: FinanceQuery;
}

const TITULOS: Record<Segmento, string> = {
  suscripciones: "Suscripciones personales",
  programados: "Ingresos y gastos programados",
  deudas: "Deudas",
  "por-cobrar": "Cuentas por cobrar personales",
};

const VACIOS: Record<Segmento, string> = {
  suscripciones: "Todavía no cargaste suscripciones. Agregá la primera para ver cuándo vence.",
  programados: "No hay ingresos ni gastos programados. Agregalos para anticipar tu flujo.",
  deudas: "No hay deudas registradas.",
  "por-cobrar": "No hay cuentas por cobrar registradas.",
};

export function CompromisosView({ data, seg, query }: CompromisosViewProps) {
  const { openEntity } = useFinanceDialogs();
  const [historial, setHistorial] = useState<{ row: FinanceRow; entity: EntidadPago } | null>(null);
  const showAll = query.status === "all" || query.status === "cancelled";
  const isSchedule = seg === "suscripciones" || seg === "programados";

  // Los meses no filtran compromisos: solo moneda, cuenta y estado (si vienen en la URL).
  const filters = { ...query, month: "" };
  const schedules = data.schedules.filter(
    (s) =>
      (seg === "suscripciones" ? s.kind === "subscription" : ["income", "expense"].includes(String(s.kind))) &&
      visibleRow(s, filters, "schedule"),
  );
  const obligations = data.obligations.filter(
    (o) => o.kind === (seg === "deudas" ? "debt" : "receivable") && visibleRow(o, filters, "obligation"),
  );
  const count = isSchedule ? schedules.length : obligations.length;

  function add() {
    if (seg === "suscripciones")
      openEntity("schedule", { title: "Agregar suscripción", defaults: { kind: "subscription" } });
    else if (seg === "deudas")
      openEntity("obligation", { title: "Agregar deuda", defaults: { kind: "debt" } });
    else if (seg === "por-cobrar")
      openEntity("obligation", {
        title: "Agregar cuenta por cobrar personal",
        defaults: { kind: "receivable" },
      });
    else openEntity("schedule", { title: "Agregar gasto programado", defaults: { kind: "expense" } });
  }

  return (
    <div className="flex flex-col gap-5">
      <VencimientosChart data={data} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmentado
          label="Tipo de compromiso"
          value={seg}
          options={SEGMENTOS.map((s) => ({
            value: s.value,
            label: s.label,
            href: buildHref(query, { seg: s.value }),
          }))}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={buildHref(query, { status: showAll ? null : "all" })}
            className="text-sm font-medium text-primary-500 hover:underline"
          >
            {showAll ? "Ocultar cancelados" : "Ver cancelados"}
          </Link>
          {seg === "programados" && (
            <Button
              appearance="outline"
              onPress={() =>
                openEntity("schedule", {
                  title: "Agregar ingreso programado",
                  defaults: { kind: "income" },
                })
              }
            >
              <Plus />
              Ingreso programado
            </Button>
          )}
          <Button onPress={add}>
            <Plus />
            {seg === "programados" ? "Gasto programado" : "Agregar"}
          </Button>
        </div>
      </div>

      <h2 className="text-base font-semibold text-text-primary">
        {TITULOS[seg]} <span className="font-normal text-text-tertiary">· {count}</span>
      </h2>

      {count === 0 ? (
        <EmptyState
          title="Nada por acá todavía"
          description={VACIOS[seg]}
          action={
            <Button onPress={add}>
              <Plus />
              Agregar
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {isSchedule
            ? schedules.map((row) => (
                <ScheduleCard
                  key={row.id}
                  row={row}
                  data={data}
                  onHistory={(r) => setHistorial({ row: r, entity: "schedule" })}
                />
              ))
            : obligations.map((row) => (
                <ObligationCard
                  key={row.id}
                  row={row}
                  data={data}
                  onHistory={(r) => setHistorial({ row: r, entity: "obligation" })}
                />
              ))}
        </div>
      )}

      {seg === "por-cobrar" && (
        <p className="text-xs text-text-tertiary">
          Wonder USD ~250 pertenece a Landing Pages, no a estas cuentas personales.
        </p>
      )}

      {historial && (
        <HistorialDialog
          data={data}
          row={historial.row}
          entity={historial.entity}
          onClose={() => setHistorial(null)}
        />
      )}
    </div>
  );
}
