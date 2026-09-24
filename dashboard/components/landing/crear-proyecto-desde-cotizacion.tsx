"use client";

import { ArrowUpRight } from "lucide-react";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import type {
  Cliente,
  Cotizacion,
  Miembro,
  Proceso,
} from "@/lib/landing/tipos";

/**
 * Abre el formulario de proyecto precargado desde una cotización aprobada.
 * El usuario confirma antes de crear: no hay creación automática.
 */
export function CrearProyectoDesdeCotizacion({
  cotizacion,
  miembros,
  clientes,
  procesos,
}: {
  cotizacion: Cotizacion;
  miembros: Miembro[];
  clientes: Pick<Cliente, "id" | "name">[];
  procesos: Pick<Proceso, "id" | "slug" | "name">[];
}) {
  return (
    <ProyectoForm
      miembros={miembros}
      clientes={clientes}
      procesos={procesos}
      desdeCotizacion={{
        quoteId: cotizacion.id,
        clientId: cotizacion.client_id,
        nombre: cotizacion.service
          ? `${cotizacion.service} — ${cotizacion.title}`
          : cotizacion.title,
      }}
      disparador={
        <span className="inline-flex items-center gap-1 text-xs font-medium text-ok hover:underline">
          <ArrowUpRight className="size-3.5" />
          Crear proyecto
        </span>
      }
    />
  );
}
