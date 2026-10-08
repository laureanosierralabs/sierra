import { FinanzasSeccion } from "@/components/finanzas-seccion";
import { BalanceTabla } from "@/components/finanzas-balance-tabla";
import { signoDe, textoMontos } from "@/components/finanzas-montos";
import { KpiCard } from "@/components/common/kpi-card";
import type { Balance, PorMoneda } from "@/lib/landing/balance";
import { nombreMes } from "@/lib/landing/meses";

export { textoMontos };

/** Los importes ya vienen por moneda: el color acompaña, el número manda. */
function Valor({ total, clase }: { total: PorMoneda; clase: string }) {
  return <span className={clase}>{textoMontos(total)}</span>;
}

export function Resumen({ balance }: { balance: Balance }) {
  const real = signoDe(balance.resultadoReal);

  return (
    <section className="mb-8 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Cobrado"
          hint="Ya entró"
          value={<Valor total={balance.cobrado} clase="text-badge-success-text" />}
        />
        <KpiCard
          label="Por cobrar"
          hint="Aprobado, impago"
          value={<Valor total={balance.porCobrar} clase="text-badge-warning-text" />}
        />
        <KpiCard
          label="Previsión"
          hint="Sin aprobar"
          value={<Valor total={balance.prevision} clase="text-text-secondary" />}
        />
        <KpiCard
          label="Por pagar equipo"
          hint="Comprometido"
          value={<Valor total={balance.porPagar} clase="text-badge-error-text" />}
        />
        <KpiCard
          label="Gasto fijo"
          hint="Por mes"
          value={<Valor total={balance.gastoMensual} clase="text-text-secondary" />}
        />
      </div>

      <KpiCard
        label="Resultado real"
        hint="Cobrado − pagado al equipo − gastos. Solo caja efectiva."
        value={
          <span
            className={
              real === "neg"
                ? "text-badge-error-text"
                : real === "pos"
                  ? "text-badge-success-text"
                  : "text-text-primary"
            }
          >
            {textoMontos(balance.resultadoReal, true)}
          </span>
        }
      />
    </section>
  );
}

export function BalanceMensual({ balance, mes }: { balance: Balance; mes?: string }) {
  return (
    <FinanzasSeccion
      titulo="Balance por mes"
      resumen={mes ? <span className="capitalize">{nombreMes(mes)}</span> : undefined}
    >
      <BalanceTabla meses={balance.meses} filtrado={Boolean(mes)} />
    </FinanzasSeccion>
  );
}
