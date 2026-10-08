"use client";

import { useMemo } from "react";
import type { FinanceData } from "@/lib/personal-finance";
import { CompromisosView } from "./compromisos/compromisos-view";
import { FinanceDialogsProvider } from "./editores/dialogos";
import { Encabezado } from "./header/encabezado";
import { VistaTabs } from "./header/vista-tabs";
import { MovimientosView } from "./movimientos/movimientos-view";
import { PatrimonioView } from "./patrimonio/patrimonio-view";
import { ResumenView } from "./resumen/resumen-view";
import type { FinanceQuery } from "./tipos";
import { resolveQuery } from "./url";

/**
 * Finanzas personales: cuatro vistas (resumen, movimientos, compromisos y
 * patrimonio) elegidas por la URL. Los editores se montan una sola vez en el
 * provider y las vistas piden abrirlos.
 */
export function FinanzasPersonal({ data, query: rawQuery }: { data: FinanceData; query: FinanceQuery }) {
  // Memoizado: los hijos usan `query` como dependencia y no deben recalcular en cada render.
  const { vista, month, tipo, seg, todoElHistorial, query } = useMemo(
    () => resolveQuery(rawQuery),
    [rawQuery],
  );

  return (
    <FinanceDialogsProvider data={data}>
      <Encabezado data={data} month={month} query={query} />
      <VistaTabs vista={vista} query={query} />
      {vista === "resumen" && <ResumenView data={data} month={month} query={query} />}
      {vista === "movimientos" && (
        <MovimientosView
          data={data}
          month={month}
          tipo={tipo}
          todoElHistorial={todoElHistorial}
          query={query}
        />
      )}
      {vista === "compromisos" && <CompromisosView data={data} seg={seg} query={query} />}
      {vista === "patrimonio" && <PatrimonioView data={data} month={month} query={query} />}
    </FinanceDialogsProvider>
  );
}
