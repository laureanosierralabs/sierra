import { BalanceMensual, Resumen } from "@/components/finanzas-balance";
import {
  ingresosPorCliente,
  margenPorProyecto,
  serieMensual,
} from "@/components/landing/finanzas/datos-graficos";
import {
  GraficoIngresosCliente,
  GraficoMargenProyectos,
  GraficoMensual,
  GraficoResultado,
} from "@/components/landing/finanzas/graficos-resumen";
import type { Balance, DatosFinanzas } from "@/lib/landing/balance";
import { listarClientes, listarProyectos } from "@/lib/landing/datos";
import type { Moneda } from "@/lib/landing/tipos";

/**
 * `completo` trae toda la serie mensual (para los gráficos); `balance` es el
 * que ya viene recortado por `?mes=` y alimenta la tabla.
 */
export async function ResumenVista({
  datos,
  completo,
  balance,
  moneda,
  mes,
}: {
  datos: DatosFinanzas;
  completo: Balance;
  balance: Balance;
  moneda: Moneda;
  mes?: string;
}) {
  const [proyectos, clientes] = await Promise.all([listarProyectos(), listarClientes()]);
  const puntos = serieMensual(completo, moneda);

  return (
    <>
      <Resumen balance={balance} />

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <GraficoMensual puntos={puntos} moneda={moneda} />
        <GraficoResultado puntos={puntos} moneda={moneda} />
        <GraficoMargenProyectos filas={margenPorProyecto(datos.cotizaciones, datos.acuerdos, proyectos, moneda)} moneda={moneda} />
        <GraficoIngresosCliente filas={ingresosPorCliente(datos.cotizaciones, clientes, moneda)} moneda={moneda} />
      </section>

      <BalanceMensual balance={balance} mes={mes} />
    </>
  );
}
