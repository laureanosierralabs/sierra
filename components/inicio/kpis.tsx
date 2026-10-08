import { CheckCircle1, ClockThree, Dollar, Wallet2 } from "@tailgrids/icons";
import { KpiEnlace } from "@/components/inicio/kpi-enlace";

export interface DatosKpis {
  cobradoMes: string;
  cobradoNota: string | null;
  porCobrar: string;
  porCobrarNota: string | null;
  tareasVencidas: number;
  tareasHoy: number;
  /** null = no se pudo cargar: la tarjeta no se muestra. */
  cashPersonal: { valor: string; nota: string } | null;
}

export function KpisInicio({ kpis }: { kpis: DatosKpis }) {
  return (
    <section
      aria-label="Resumen"
      className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
    >
      <KpiEnlace
        href="/landing-pages/finanzas"
        label="Cobrado este mes"
        value={kpis.cobradoMes}
        hint={kpis.cobradoNota ? `Además: ${kpis.cobradoNota}` : "Landing Pages · USD"}
        icon={<Dollar />}
        tone="success"
      />
      <KpiEnlace
        href="/landing-pages/quotes"
        label="Por cobrar"
        value={kpis.porCobrar}
        hint={
          kpis.porCobrarNota
            ? `Además: ${kpis.porCobrarNota}`
            : "Cotizaciones aprobadas con saldo · USD"
        }
        icon={<ClockThree />}
        tone="warning"
      />
      <KpiEnlace
        href="/landing-pages/tasks"
        label="Tareas vencidas"
        value={kpis.tareasVencidas}
        hint={`${kpis.tareasHoy} ${kpis.tareasHoy === 1 ? "vence" : "vencen"} hoy`}
        icon={<CheckCircle1 />}
        tone={kpis.tareasVencidas > 0 ? "error" : "gray"}
      />
      {kpis.cashPersonal && (
        <KpiEnlace
          href="/finanzas/personal"
          label="Cash personal"
          value={kpis.cashPersonal.valor}
          hint={kpis.cashPersonal.nota}
          icon={<Wallet2 />}
          tone="primary"
        />
      )}
    </section>
  );
}
