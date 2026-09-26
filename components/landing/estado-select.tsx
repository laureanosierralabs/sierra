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

/** Color por estado. El select lo toma con --tono; el CSS hace el vidrio. */
const TONO: Record<string, string> = {
  // Proyecto
  "por-iniciar": "var(--idle)",
  "en-progreso": "var(--ok)",
  "en-revision": "var(--warn)",
  "esperando-cliente": "var(--critical)",
  "stand-by": "var(--text-3)",
  entregado: "var(--ok)",
  // Tarea
  pendiente: "var(--idle)",
  bloqueada: "var(--critical)",
  completada: "var(--ok)",
  // Cliente
  prospecto: "var(--idle)",
  cliente: "var(--ok)",
  inactivo: "var(--text-3)",
  // Cotización
  borrador: "var(--text-3)",
  enviada: "var(--idle)",
  seguimiento: "var(--warn)",
  aprobada: "var(--ok)",
  rechazada: "var(--critical)",
};

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
      style={{ "--tono": TONO[valor] ?? "var(--text-2)" } as React.CSSProperties}
      className="select-glass cursor-pointer rounded-md px-2 py-1 text-xs font-medium outline-none disabled:opacity-50"
    >
      {opciones.map((e) => (
        <option key={e} value={e}>
          {labels[e]}
        </option>
      ))}
    </select>
  );
}
