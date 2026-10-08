"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  cambiarEstadoCliente,
  cambiarEstadoCotizacion,
  cambiarEstadoProyecto,
  cambiarEstadoTarea,
} from "@/app/landing-pages/acciones";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
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

/* Misma familia de color que los badges de estado (components/landing/ui.tsx). */
const OK = "text-badge-success-text";
const WARN = "text-badge-warning-text";
const CRITICAL = "text-badge-error-text";
const IDLE = "text-badge-blue-text";
const NEUTRO = "text-badge-neutral-text";

/** Color del punto por estado: señaliza, el texto confirma. */
const TONO: Record<string, string> = {
  // Proyecto
  "por-iniciar": IDLE,
  "en-progreso": OK,
  "en-revision": WARN,
  "esperando-cliente": CRITICAL,
  "stand-by": NEUTRO,
  entregado: OK,
  // Tarea
  pendiente: IDLE,
  bloqueada: CRITICAL,
  completada: NEUTRO,
  // Cliente
  prospecto: IDLE,
  cliente: OK,
  inactivo: NEUTRO,
  // Cotización — en inglés desde que se separó estado comercial de pago.
  draft: NEUTRO,
  sent: IDLE,
  approved: OK,
  rejected: CRITICAL,
  cancelled: NEUTRO,
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

function Punto({ estado }: { estado: string }) {
  return (
    <span
      aria-hidden="true"
      className={`size-2 shrink-0 rounded-full bg-current ${TONO[estado] ?? NEUTRO}`}
    />
  );
}

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
    <Select
      aria-label="Cambiar estado"
      value={valor}
      isDisabled={pendiente}
      onChange={(key) => {
        const nuevo = String(key);
        if (nuevo === valor) return;
        iniciar(async () => {
          try {
            await accion(id, nuevo);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo cambiar el estado");
          }
        });
      }}
      className="w-40"
    >
      <SelectTrigger size="xs" className="gap-2 px-2.5 font-medium">
        <Punto estado={valor} />
        <SelectValue className="flex-1 text-left" />
        <SelectIndicator />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((e) => (
          <SelectItem key={e} id={e} textValue={labels[e]}>
            <Punto estado={e} />
            {labels[e]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
