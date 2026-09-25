"use client";

import { useTransition } from "react";
import {
  cambiarEstadoCliente,
  cambiarEstadoCotizacion,
  cambiarEstadoProyecto,
  cambiarEstadoTarea,
} from "@/app/landing-pages/acciones";
import {
  ESTADOS_CLIENTE,
  ESTADOS_COTIZACION,
  ESTADOS_PROYECTO,
  ESTADOS_TAREA,
  LABEL_ESTADO_CLIENTE,
  LABEL_ESTADO_COTIZACION,
  LABEL_ESTADO_PROYECTO,
  LABEL_ESTADO_TAREA,
} from "@/lib/landing/tipos";

type Tipo = "proyecto" | "tarea" | "cliente" | "cotizacion";

const CONFIG: Record<
  Tipo,
  {
    opciones: readonly string[];
    labels: Record<string, string>;
    accion: (id: string, estado: string) => Promise<void>;
  }
> = {
  proyecto: {
    opciones: ESTADOS_PROYECTO,
    labels: LABEL_ESTADO_PROYECTO,
    accion: cambiarEstadoProyecto,
  },
  tarea: {
    opciones: ESTADOS_TAREA,
    labels: LABEL_ESTADO_TAREA,
    accion: cambiarEstadoTarea,
  },
  cliente: {
    opciones: ESTADOS_CLIENTE,
    labels: LABEL_ESTADO_CLIENTE,
    accion: cambiarEstadoCliente,
  },
  cotizacion: {
    opciones: ESTADOS_COTIZACION,
    labels: LABEL_ESTADO_COTIZACION,
    accion: cambiarEstadoCotizacion,
  },
};

/** Cambio de estado en un paso desde la tabla, sin abrir el formulario. */
export function EstadoSelect({
  id,
  valor,
  tipo,
}: {
  id: string;
  valor: string;
  tipo: Tipo;
}) {
  const [pendiente, iniciar] = useTransition();
  const { opciones, labels, accion } = CONFIG[tipo];

  return (
    <select
      value={valor}
      disabled={pendiente}
      aria-label="Cambiar estado"
      onChange={(e) => {
        const nuevo = e.target.value;
        iniciar(async () => {
          await accion(id, nuevo);
        });
      }}
      className="cursor-pointer rounded-md border border-line bg-surface-2 px-2 py-1 text-xs text-text outline-none transition-colors hover:border-line-strong disabled:opacity-50"
    >
      {opciones.map((e) => (
        <option key={e} value={e}>
          {labels[e]}
        </option>
      ))}
    </select>
  );
}
