"use client";

import Link from "next/link";
import { Progress } from "@/components/tailgrids/core/progress";
import { money, type FinanceData } from "@/lib/personal-finance";
import { goalStats } from "@/lib/personal-finance-stats";
import { SeccionCard } from "../seccion-card";
import type { FinanceQuery } from "../tipos";
import { vistaHref } from "../url";

export function ObjetivosResumen({
  data,
  month,
  query,
}: {
  data: FinanceData;
  month: string;
  query: FinanceQuery;
}) {
  const goals = data.goals.filter((goal) => goal.status === "active").slice(0, 3);

  return (
    <SeccionCard
      title="Objetivos"
      description="Avance de los objetivos activos"
      action={
        <Link
          href={vistaHref(query, "patrimonio")}
          className="text-sm font-medium text-primary-500 hover:underline"
        >
          Ver todos
        </Link>
      }
    >
      {goals.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          Creá un objetivo de ahorro o de ingreso mensual desde{" "}
          <Link href={vistaHref(query, "patrimonio")} className="font-medium text-primary-500 hover:underline">
            Patrimonio
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {goals.map((goal) => {
            const { accumulated, progress } = goalStats(goal, data, month);
            return (
              <li key={goal.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-text-primary">{String(goal.name)}</p>
                  <span className="text-xs font-semibold text-primary-500 tabular-nums">
                    {accumulated === null ? "Sin estimación" : `${Math.round(progress)}%`}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {goal.kind === "income"
                    ? `Ingresos recibidos · ${month}`
                    : "Ahorro / patrimonio"}
                  {goal.target_date ? ` · ${goal.target_date}` : ""}
                </p>
                <Progress progress={progress} className="mt-2.5 max-w-none" />
                <p className="mt-2 text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">
                    {money(accumulated, goal.currency)}
                  </span>{" "}
                  de {money(goal.amount, goal.currency)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </SeccionCard>
  );
}
