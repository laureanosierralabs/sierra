import { FinanzasVista } from "@/components/finanzas-vista";
import { FinanzasCotizaciones } from "@/components/finanzas-cotizaciones";

export const dynamic = "force-dynamic";

export default function FinanzasNegocio() {
  return (
    <>
      {/* Las cotizaciones se leen de quotes, no se copian a movimientos:
          duplicar el importe seria contar dos veces el mismo dinero. */}
      <div className="w-full px-6 pt-10 md:px-10">
        <FinanzasCotizaciones />
      </div>
      <FinanzasVista ambito="negocio" titulo="Finanzas Negocio" />
    </>
  );
}
