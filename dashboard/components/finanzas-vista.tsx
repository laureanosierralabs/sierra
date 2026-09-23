import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, Empty } from "@/components/ui";
import { MovimientoForm } from "@/components/movimiento-form";
import { BorrarMovimiento } from "@/components/borrar-movimiento";
import {
  egresosPorCategoria,
  getMovimientos,
  resumenPorMes,
  type Ambito,
  type Moneda,
  type TotalMoneda,
} from "@/lib/finanzas";

const CAT_LABEL: Record<string, string> = {
  equipo: "Equipo",
  suscripcion: "Suscripciones",
  herramienta: "Herramientas",
  impuesto: "Impuestos",
  cliente: "Clientes",
  otro: "Otro",
};

function fmt(monto: number, moneda: Moneda): string {
  const n = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Math.abs(monto),
  );
  const signo = monto < 0 ? "-" : "";
  return moneda === "USD" ? `${signo}US$ ${n}` : `${signo}$ ${n}`;
}

/** Muestra ARS y USD por separado; omite la moneda en cero. */
function Montos({
  total,
  clase,
}: {
  total: TotalMoneda;
  clase?: string;
}) {
  const partes: string[] = [];
  if (total.ARS !== 0) partes.push(fmt(total.ARS, "ARS"));
  if (total.USD !== 0) partes.push(fmt(total.USD, "USD"));
  if (partes.length === 0) partes.push("$ 0");
  return (
    <span className={`tnum ${clase ?? ""}`}>
      {partes.map((p, i) => (
        <span key={i} className="block leading-tight">
          {p}
        </span>
      ))}
    </span>
  );
}

export function FinanzasVista({
  ambito,
  titulo,
}: {
  ambito: Ambito;
  titulo: string;
}) {
  const meses = resumenPorMes(ambito);
  const movs = getMovimientos().filter((m) => m.ambito === ambito);
  const mesActual = meses[0]?.mes;
  const egresos = mesActual ? egresosPorCategoria(ambito, mesActual) : [];

  if (movs.length === 0) {
    return (
      <div className="w-full px-6 py-10 md:px-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Finanzas</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              {titulo}
            </h1>
          </div>
          <MovimientoForm ambito={ambito} />
        </header>
        <Card className="p-10 text-center">
          <Empty>
            Todavía no hay movimientos. Cargá el primero con el botón de arriba,
            o contámelo por la terminal.
          </Empty>
        </Card>
      </div>
    );
  }

  const mes = meses[0];

  return (
    <div className="w-full px-6 py-10 md:px-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Finanzas · {mes.mes}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{titulo}</h1>
        </div>
        <MovimientoForm ambito={ambito} />
      </header>

      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-ok">
            <ArrowUpRight className="size-4" />
            <p className="text-xs text-text-3">Ingresos del mes</p>
          </div>
          <div className="mt-2 text-xl font-bold">
            <Montos total={mes.ingresos} clase="text-ok" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-critical">
            <ArrowDownRight className="size-4" />
            <p className="text-xs text-text-3">Egresos del mes</p>
          </div>
          <div className="mt-2 text-xl font-bold">
            <Montos total={mes.egresos} clase="text-critical" />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-3">Balance del mes</p>
          <div className="mt-2 text-xl font-bold">
            <Montos total={mes.balance} />
          </div>
        </Card>
      </section>

      {egresos.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-2">
            Egresos por categoría · {mes.mes}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {egresos.map((e) => (
              <Card key={e.categoria} className="p-4">
                <p className="text-xs text-text-3">
                  {CAT_LABEL[e.categoria] ?? e.categoria}
                </p>
                <div className="mt-1.5 font-semibold">
                  <Montos total={e.total} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-2">
          Movimientos
        </h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-text-3">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="tnum whitespace-nowrap px-4 py-3 text-text-2">
                    {m.fecha}
                  </td>
                  <td className="px-4 py-3">
                    <span>{m.concepto}</span>
                    {m.persona && (
                      <span className="ml-2 text-xs text-text-3">{m.persona}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-2">
                    {CAT_LABEL[m.categoria] ?? m.categoria}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoMovPill estado={m.estado} />
                  </td>
                  <td
                    className={`tnum whitespace-nowrap px-4 py-3 text-right font-semibold ${
                      m.tipo === "ingreso" ? "text-ok" : "text-critical"
                    }`}
                  >
                    {m.tipo === "ingreso" ? "+" : "−"}
                    {fmt(m.monto, m.moneda)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <MovimientoForm ambito={ambito} movimiento={m} />
                      <BorrarMovimiento id={m.id} ambito={ambito} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

function EstadoMovPill({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    pagado: "text-text-3",
    cobrado: "text-ok",
    pendiente: "text-warn",
  };
  return (
    <span className={`text-xs ${map[estado] ?? "text-text-3"}`}>
      {estado[0].toUpperCase() + estado.slice(1)}
    </span>
  );
}
