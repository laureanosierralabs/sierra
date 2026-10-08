import { FinanzasSeccion } from "@/components/finanzas-seccion";
import { GastosTabla } from "@/components/finanzas-gastos-tabla";
import { GastoForm } from "@/components/landing/gasto-form";
import { listarGastosFijos } from "@/lib/landing/datos";
import { costoMensual, formatearMonto, gastoVigente } from "@/lib/landing/tipos";

/**
 * Va después de ingresos y equipo a propósito: es el número más chico y no
 * debería competir visualmente con las ventas.
 */
export async function FinanzasGastos() {
  const gastos = await listarGastosFijos();
  const hoy = new Date().toISOString().slice(0, 7);

  const mensual = gastos
    .filter((g) => gastoVigente(g, hoy))
    .reduce((t, g) => t + costoMensual(g), 0);

  return (
    <FinanzasSeccion
      titulo="Gastos operativos"
      resumen={mensual > 0 ? `${formatearMonto(mensual, "USD")}/mes` : undefined}
      accion={<GastoForm />}
    >
      <GastosTabla gastos={gastos} hoy={hoy} />
    </FinanzasSeccion>
  );
}
