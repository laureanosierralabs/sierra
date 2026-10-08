"use client";

import { Pencil1, Plus } from "@tailgrids/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import { money, today, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import { goalStats, hasUnbackedReserve } from "@/lib/personal-finance-stats";
import { useFinanceDialogs } from "../editores/dialogos";
import { colorEstado, etiqueta } from "../tipos";
import { HitosYAportes } from "./hitos-aportes";

export function ObjetivoCard({
  goal,
  data,
  month,
}: {
  goal: FinanceRow;
  data: FinanceData;
  month: string;
}) {
  const { openEntity } = useFinanceDialogs();
  const { accumulated, gap, progress, days } = goalStats(goal, data, month);
  const currency = String(goal.currency);
  const savings = goal.kind === "savings";

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-text-primary">{String(goal.name)}</h3>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {goal.kind === "income" ? "Ingreso mensual neto" : "Ahorro / patrimonio"}
          </p>
        </div>
        <Badge size="sm" color={colorEstado(goal.status)}>
          {etiqueta(goal.status)}
        </Badge>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xl font-semibold text-text-primary tabular-nums">
            {money(accumulated, currency)}
          </p>
          <p className="text-xs text-text-tertiary tabular-nums">
            de {money(goal.amount, currency)} · {progress.toFixed(1)}%
          </p>
        </div>
        <Progress progress={progress} className="mt-3 max-w-none" />
      </div>

      <p className="text-xs text-text-secondary">
        Faltante: {money(accumulated === null ? null : gap, currency)} ·{" "}
        {String(goal.target_date ?? "Sin fecha estricta")}{" "}
        {days !== null &&
          `· ${days < 0 ? "Vencido" : `${days} días`} · ${days > 0 ? `${money(gap / days, currency)} / día aproximado` : "Revisar plazo"}`}
      </p>

      {goal.kind === "income" && (
        <p className="text-xs text-text-tertiary">
          Mes {month}: solo ingresos personales efectivamente recibidos. No se suma facturación
          empresarial.
        </p>
      )}
      {goal.description && <p className="text-xs text-text-tertiary">{String(goal.description)}</p>}
      {hasUnbackedReserve(goal, data) && (
        <p className="text-xs text-warning-500">
          Reservas registradas sin respaldo suficiente en cash actual. Revisar o liberar aportes; no
          representan dinero adicional.
        </p>
      )}

      <HitosYAportes goal={goal} data={data} />

      <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-card-border pt-4">
        <Button
          size="sm"
          appearance="outline"
          onPress={() => openEntity("goal", { row: goal, title: "Editar objetivo" })}
        >
          <Pencil1 />
          Editar
        </Button>
        <Button
          size="sm"
          appearance="outline"
          onPress={() =>
            openEntity("milestone", { title: "Agregar hito", defaults: { goal_id: goal.id } })
          }
        >
          <Plus />
          Hito
        </Button>
        {savings && (
          <Button
            size="sm"
            onPress={() =>
              openEntity("contribution", {
                title: "Reservar / aportar dinero existente",
                defaults: { goal_id: goal.id, currency, contributed_on: today() },
              })
            }
          >
            <Plus />
            Aportar
          </Button>
        )}
      </div>
    </Card>
  );
}
