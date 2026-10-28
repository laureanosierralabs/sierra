"use client";

import { monto, numero, porcentaje, TARJETA } from "@/components/portal/resultados/formato";
import type { ResultadosVista } from "@/lib/lanzamientos/resultados";
import { LABEL_TIPO_LANDING } from "@/lib/lanzamientos/tipos";
import { cn } from "@/utils/cn";

/** Una tarjeta por landing: visitas, registros (o ventas) y qué tan bien convierte. Tocarla filtra por ella. */
export function BloquePorLanding({
  r,
  onElegir,
}: {
  r: ResultadosVista;
  onElegir: (id: string | null) => void;
}) {
  const mejorCvr = Math.max(...r.porLanding.map((p) => p.cvr ?? 0), 0.1);
  const nombre = (id: string) => r.porLanding.find((p) => p.id === id)?.name ?? "";

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {r.porLanding.map((p) => {
          const elegida = r.landing?.id === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={elegida}
                onClick={() => onElegir(elegida ? null : p.id)}
                className={cn(
                  TARJETA,
                  "flex h-full w-full flex-col gap-4 p-4 text-left transition-colors outline-none hover:bg-white/7 focus-visible:ring-2 focus-visible:ring-primary-500 sm:p-5",
                  elegida && "bg-primary-500/10 ring-primary-500/50",
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 text-sm font-semibold break-words">{p.name}</span>
                  <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[11px] font-medium text-white/70">
                    {LABEL_TIPO_LANDING[p.kind]}
                  </span>
                </span>
                <span className="grid grid-cols-2 gap-3">
                  <span>
                    <span className="block text-2xl font-extrabold tracking-tighter tabular-nums">
                      {p.visitantes > 0 ? numero(p.visitantes) : "—"}
                    </span>
                    <span className="text-xs text-white/55">visitantes</span>
                  </span>
                  <span>
                    <span className="block text-2xl font-extrabold tracking-tighter tabular-nums">{numero(p.conversiones)}</span>
                    <span className="text-xs text-white/55">{p.kind === "venta" ? "ventas" : "registros"}</span>
                  </span>
                </span>
                {p.ingresos.length > 0 && (
                  <span className="text-xs text-white/65 tabular-nums">
                    Ingresos: {p.ingresos.map(([moneda, total]) => `${moneda} ${monto(total)}`).join(" · ")}
                  </span>
                )}
                <span>
                  <span className="flex items-baseline justify-between text-xs">
                    <span className="text-white/55">{p.kind === "venta" ? "Conversión a venta" : "Conversión a registro"}</span>
                    <strong className="text-sm font-semibold text-white tabular-nums">{porcentaje(p.cvr)}</strong>
                  </span>
                  <span aria-hidden="true" className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full bg-[#5073ff]"
                      style={{ width: `${p.cvr === null ? 0 : Math.max((p.cvr / mejorCvr) * 100, 3)}%` }}
                    />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {r.comparaciones.map((c) => (
        <p key={c.tipo} className="text-sm leading-relaxed text-white/70">
          {c.significativa ? (
            <>
              <strong className="font-semibold text-white">{nombre(c.mejor)}</strong> convierte mejor que{" "}
              {nombre(c.segunda)} y la diferencia es consistente (95% de confianza).
            </>
          ) : (
            <>
              Todavía no hay una ganadora: la diferencia entre {nombre(c.mejor)} y {nombre(c.segunda)} puede ser casualidad.
              Hace falta más tráfico.
            </>
          )}
        </p>
      ))}
    </div>
  );
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className={cn(TARJETA, "p-4 sm:p-5")}>
      <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase">{etiqueta}</h3>
      <p className="mt-2 text-3xl font-extrabold tracking-tighter tabular-nums">{valor}</p>
      {nota && <p className="mt-1 text-xs leading-snug text-white/55">{nota}</p>}
    </div>
  );
}

/** Ventas del período: cuántas, cuánto ingresó y qué parte de los registrados compró. */
export function BloqueVentas({ r }: { r: ResultadosVista }) {
  const { checkout } = r;
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Dato etiqueta="Ventas" valor={numero(r.actual.ventas)} nota="Compras confirmadas." />
        {r.ingresos.length === 0 ? (
          <Dato etiqueta="Ingresos" valor="—" nota="Aún no hay montos medidos." />
        ) : (
          r.ingresos.map(([moneda, total]) => (
            <Dato key={moneda} etiqueta={`Ingresos (${moneda})`} valor={monto(total)} nota="Cada moneda por separado, sin convertir." />
          ))
        )}
        {r.registrosQueCompraron !== null && (
          <Dato etiqueta="Registros que compraron" valor={porcentaje(r.registrosQueCompraron)} nota="Ventas sobre registros del período." />
        )}
        {checkout && (
          <Dato
            etiqueta="Clics al checkout"
            valor={numero(checkout.total)}
            nota={checkout.tasaCompra !== null ? `${porcentaje(checkout.tasaCompra)} de esos clics terminó en compra.` : "Personas que fueron a pagar."}
          />
        )}
      </div>
      {r.precioLista && <p className="text-xs text-white/50">Ingresos según precio de lista (sin cupones ni reembolsos).</p>}
      {r.ventasSinFecha > 0 && (
        <p className="text-xs text-white/50">
          {numero(r.ventasSinFecha)} {r.ventasSinFecha === 1 ? "venta no tiene" : "ventas no tienen"} fecha conocida y no aparecen en el gráfico por día.
        </p>
      )}
    </div>
  );
}
