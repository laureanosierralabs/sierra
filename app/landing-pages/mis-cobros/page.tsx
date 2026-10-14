import Link from "next/link";
import { CheckCircle1, ClockThree, Wallet2 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { EstadoPagoPill, PageHeader } from "@/components/landing/ui";
import { Card } from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import { misAcuerdos, totalesPorMoneda } from "@/lib/landing/mis-cobros";
import { codigoAcuerdo, fechaCorta, formatearMonto } from "@/lib/landing/tipos";

export const dynamic = "force-dynamic";

/**
 * Lo que la persona del equipo cobra por su trabajo: lo acordado, lo pagado y
 * lo que falta, por acuerdo y por proyecto. Solo lo suyo (ver lib/landing/mis-cobros.ts).
 */
export default async function MisCobros() {
  const acuerdos = await misAcuerdos();
  const totales = totalesPorMoneda(acuerdos);

  return (
    <>
      <PageHeader titulo="Mis cobros" descripcion="Lo acordado por tu trabajo y lo que ya cobraste" />

      {acuerdos.length === 0 ? (
        <EmptyState
          title="Todavía no tenés acuerdos cargados"
          description="Cuando se registre un acuerdo a tu nombre, vas a ver acá cuánto cobrás por cada proyecto y los pagos que recibas."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {totales.map((t) => (
            <div key={t.moneda} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label={`Acordado (${t.moneda})`}
                value={formatearMonto(t.acordado, t.moneda)}
                icon={<Wallet2 />}
                tone="primary"
              />
              <KpiCard
                label="Cobrado"
                value={formatearMonto(t.cobrado, t.moneda)}
                icon={<CheckCircle1 />}
                tone="success"
              />
              <KpiCard
                label="Pendiente"
                value={formatearMonto(t.pendiente, t.moneda)}
                icon={<ClockThree />}
                tone={t.pendiente > 0 ? "warning" : "gray"}
              />
            </div>
          ))}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {acuerdos.map((a) => {
              const pendiente = Math.max((a.total_amount ?? 0) - a.amount_paid, 0);
              const avance =
                a.total_amount && a.total_amount > 0
                  ? Math.min(Math.round((a.amount_paid / a.total_amount) * 100), 100)
                  : 0;

              return (
                <Card key={a.id} className="flex flex-col gap-4">
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
                      <p className="font-semibold text-text-primary">
                        {formatearMonto(a.total_amount, a.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Cobrado</p>
                      <p className="font-semibold text-badge-success-text">
                        {formatearMonto(a.amount_paid, a.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Pendiente</p>
                      <p className={pendiente > 0 ? "font-semibold text-badge-warning-text" : "text-text-tertiary"}>
                        {pendiente > 0 ? formatearMonto(pendiente, a.currency) : "—"}
                      </p>
                    </div>
                  </div>

                  {a.total_amount ? <Progress progress={avance} className="max-w-none" /> : null}

                  {a.payment_terms && (
                    <p className="text-xs text-text-tertiary">Condiciones: {a.payment_terms}</p>
                  )}

                  <div className="border-t border-card-border pt-3">
                    <p className="mb-2 text-xs font-medium text-text-secondary">Pagos recibidos</p>
                    {a.pagos.length === 0 ? (
                      <p className="text-xs text-text-tertiary">Todavía no hay pagos registrados.</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {a.pagos.map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="tabular-nums text-text-secondary">
                              {fechaCorta(p.paid_on)}
                              {p.method ? <span className="text-text-tertiary"> · {p.method}</span> : null}
                            </span>
                            <span className="font-medium tabular-nums text-text-primary">
                              {formatearMonto(p.amount, a.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
