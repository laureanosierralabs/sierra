import { FinanzasCotizaciones } from "@/components/finanzas-cotizaciones";
import { FinanzasEgresos } from "@/components/finanzas-egresos";
import { FinanzasGastos } from "@/components/finanzas-gastos";
import {
  comprometidoPorMiembro,
  cotizadoPorEstado,
  gastoPorCategoria,
} from "@/components/landing/finanzas/datos-graficos";
import {
  GraficoCotizadoPorEstado,
  GraficoEgresosPorMiembro,
  GraficoGastosPorCategoria,
} from "@/components/landing/finanzas/graficos-secciones";
import type { DatosFinanzas } from "@/lib/landing/balance";
import type { Moneda } from "@/lib/landing/tipos";

/** Las tablas de siempre, con un gráfico arriba hecho con los datos ya cargados. */
export function CotizacionesVista({ datos, moneda }: { datos: DatosFinanzas; moneda: Moneda }) {
  return (
    <>
      <div className="mb-8">
        <GraficoCotizadoPorEstado
          filas={cotizadoPorEstado(datos.cotizaciones, moneda)}
          moneda={moneda}
        />
      </div>
      <FinanzasCotizaciones />
    </>
  );
}

export function EgresosVista({ datos, moneda }: { datos: DatosFinanzas; moneda: Moneda }) {
  return (
    <>
      <div className="mb-8">
        <GraficoEgresosPorMiembro
          filas={comprometidoPorMiembro(datos.acuerdos, moneda)}
          moneda={moneda}
        />
      </div>
      <FinanzasEgresos />
    </>
  );
}

export function GastosVista({ datos, moneda }: { datos: DatosFinanzas; moneda: Moneda }) {
  return (
    <>
      <div className="mb-8">
        <GraficoGastosPorCategoria filas={gastoPorCategoria(datos.gastos, moneda)} moneda={moneda} />
      </div>
      <FinanzasGastos />
    </>
  );
}
