"use client";

import { Plus } from "@tailgrids/icons";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/tailgrids/core/button";
import type { FinanceData } from "@/lib/personal-finance";
import { AjustesSheet } from "../ajustes/ajustes-sheet";
import { useFinanceDialogs } from "../editores/dialogos";
import type { FinanceQuery } from "../tipos";
import { MonthNav } from "./month-nav";
import { RatePopover } from "./rate-popover";

interface EncabezadoProps {
  data: FinanceData;
  month: string;
  query: FinanceQuery;
}

/** Título, mes, cotización y acciones globales: se repite igual en las cuatro vistas. */
export function Encabezado({ data, month, query }: EncabezadoProps) {
  const { openMovement } = useFinanceDialogs();

  return (
    <PageHeader
      title="Finanzas"
      description="Dinero de Laureano. Los negocios conservan su caja; solo los retiros registrados ingresan aquí."
      className="mb-5"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <MonthNav data={data} month={month} query={query} />
          <RatePopover data={data} />
          <Button variant="success" onPress={() => openMovement("ingreso")}>
            <Plus />
            Ingreso
          </Button>
          <Button onPress={() => openMovement("egreso")}>
            <Plus />
            Gasto
          </Button>
          <AjustesSheet data={data} />
        </div>
      }
    />
  );
}
