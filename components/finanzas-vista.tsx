import { ArrowAngularDownLeft, ArrowAngularTopRight, Folder1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { CAT_LABEL, Montos } from "@/components/finanzas-formato";
import { FinanzasMovimientosTabla } from "@/components/finanzas-movimientos-tabla";
import { SeccionTitulo } from "@/components/landing/ui";
import { MovimientoForm } from "@/components/movimiento-form";
import { Card } from "@/components/tailgrids/core/card";
import { egresosPorCategoria, getMovimientos, resumenPorMes, type Ambito } from "@/lib/finanzas";

export async function FinanzasVista({
  ambito,
  titulo,
}: {
  ambito: Ambito;
  titulo: string;
}) {
  const [meses, todos] = await Promise.all([resumenPorMes(ambito), getMovimientos()]);

  const movs = todos.filter((m) => m.ambito === ambito);
  const mes = meses[0];
  const egresos = mes ? await egresosPorCategoria(ambito, mes.mes) : [];

  if (movs.length === 0 || !mes) {
    return (
      <PageContainer>
        <PageHeader title={titulo} actions={<MovimientoForm ambito={ambito} />} />
        <EmptyState
          title="Todavía no hay movimientos"
          description="Cargá el primero con el botón de arriba, o contámelo por la terminal."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={titulo}
        description={`Finanzas · ${mes.mes}`}
        actions={<MovimientoForm ambito={ambito} />}
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Ingresos del mes"
          tone="success"
          icon={<ArrowAngularTopRight />}
          value={<Montos total={mes.ingresos} />}
        />
        <KpiCard
          label="Egresos del mes"
          tone="error"
          icon={<ArrowAngularDownLeft />}
          value={<Montos total={mes.egresos} />}
        />
        <KpiCard label="Balance del mes" value={<Montos total={mes.balance} />} />
      </section>

      {egresos.length > 0 && (
        <section className="mb-8">
          <SeccionTitulo icono={Folder1}>Egresos por categoría · {mes.mes}</SeccionTitulo>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {egresos.map((e) => (
              <Card key={e.categoria}>
                <p className="text-xs text-text-tertiary">{CAT_LABEL[e.categoria] ?? e.categoria}</p>
                <div className="mt-1.5 font-semibold text-text-primary tabular-nums">
                  <Montos total={e.total} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <SeccionTitulo icono={Folder1}>Movimientos</SeccionTitulo>
        <FinanzasMovimientosTabla movimientos={movs} ambito={ambito} />
      </section>
    </PageContainer>
  );
}
