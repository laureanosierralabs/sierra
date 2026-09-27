import { FinanzasVista } from "@/components/finanzas-vista";
import { FinanzasBalance } from "@/components/finanzas-balance";
import { FinanzasCotizaciones } from "@/components/finanzas-cotizaciones";

export const dynamic = "force-dynamic";

export default function FinanzasNegocio() {
  return (
    <>
      {/* Todo sale de cotizaciones, acuerdos y gastos fijos: no hay un
          movimiento espejo por cada cobro, que contaría el dinero dos veces. */}
      <div className="w-full px-6 pt-10 md:px-10">
        <header className="mb-8">
          <p className="eyebrow">Finanzas</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Finanzas Negocio
          </h1>
        </header>

        <FinanzasBalance />
        <FinanzasCotizaciones />
      </div>

      <FinanzasVista ambito="negocio" titulo="Movimientos sueltos" />
    </>
  );
}
