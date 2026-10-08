"use client";

import { Pencil1 } from "@tailgrids/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { money, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import { useFinanceDialogs } from "../editores/dialogos";
import { accountName, colorEstado, etiqueta } from "../tipos";

/** Hitos y aportes de un objetivo, con acceso directo a editarlos. */
export function HitosYAportes({ goal, data }: { goal: FinanceRow; data: FinanceData }) {
  const { openEntity } = useFinanceDialogs();
  const milestones = data.milestones.filter((m) => m.goal_id === goal.id);
  const contributions =
    goal.kind === "savings" ? data.contributions.filter((c) => c.goal_id === goal.id) : [];
  const currency = String(goal.currency);

  if (milestones.length === 0 && contributions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 border-t border-card-border pt-4">
      {milestones.length > 0 && (
        <section aria-label={`Hitos de ${goal.name}`}>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-text-tertiary uppercase">Hitos</h4>
          <ul className="flex flex-col gap-2.5">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-text-primary">{String(m.name)}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary tabular-nums">
                    {money(m.amount, currency)} ·{" "}
                    {String(m.target_date ?? m.target_month ?? "Fecha pendiente")}
                  </p>
                  {m.description && (
                    <p className="mt-0.5 text-xs text-text-tertiary">{String(m.description)}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge size="sm" color={colorEstado(m.status)}>
                    {etiqueta(m.status)}
                  </Badge>
                  <Button
                    size="xs"
                    appearance="outline"
                    iconOnly
                    aria-label={`Editar hito ${m.name}`}
                    onPress={() => openEntity("milestone", { row: m, title: "Editar hito" })}
                  >
                    <Pencil1 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {contributions.length > 0 && (
        <section aria-label={`Aportes a ${goal.name}`}>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-text-tertiary uppercase">Aportes</h4>
          <ul className="flex flex-col gap-2.5">
            {contributions.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <p className="text-sm text-text-primary tabular-nums">
                  {String(c.contributed_on)} · {money(c.amount, c.currency)}
                  <span className="text-text-tertiary"> · {accountName(data.accounts, c.account_id)}</span>
                </p>
                <Button
                  size="xs"
                  appearance="outline"
                  iconOnly
                  aria-label={`Editar o liberar el aporte del ${c.contributed_on}`}
                  onPress={() =>
                    openEntity("contribution", { row: c, title: "Editar / liberar aporte" })
                  }
                >
                  <Pencil1 />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
