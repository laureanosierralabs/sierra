"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { toast } from "sonner";
import { cambiarEstadoCliente } from "@/app/contexto/acciones";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";

/* Misma familia de color que los badges de estado (ClienteEstado en ui.tsx). */
const OPCIONES = [
  { v: "activo", l: "Activo", c: "text-badge-success-text" },
  { v: "stand-by", l: "Stand by", c: "text-badge-warning-text" },
  { v: "inactivo", l: "Inactivo", c: "text-badge-neutral-text" },
  { v: "prospecto", l: "Prospecto", c: "text-badge-blue-text" },
];

function Punto({ clase }: { clase: string }) {
  return <span aria-hidden="true" className={`size-2 shrink-0 rounded-full bg-current ${clase}`} />;
}

export function EstadoClienteSelect({
  archivo,
  slug,
  unidad,
  estado,
}: {
  archivo: string;
  slug: string;
  unidad: string;
  estado: string;
}) {
  const [valor, setValor] = useState(estado);
  const [pendiente, startTransition] = useTransition();
  const actual = OPCIONES.find((o) => o.v === valor);

  return (
    <Select
      aria-label="Estado del cliente"
      value={valor}
      isDisabled={pendiente}
      onChange={(key) => {
        const nuevo = String(key);
        if (nuevo === valor) return;
        const previo = valor;
        setValor(nuevo);
        startTransition(async () => {
          try {
            await cambiarEstadoCliente(archivo, nuevo, slug, unidad);
          } catch (e) {
            unstable_rethrow(e);
            setValor(previo);
            toast.error(e instanceof Error ? e.message : "No se pudo cambiar el estado");
          }
        });
      }}
      className="w-36 shrink-0"
    >
      <SelectTrigger size="xs" className="gap-2 px-2.5 font-medium">
        <Punto clase={actual?.c ?? "text-badge-neutral-text"} />
        <SelectValue className="flex-1 text-left" />
        <SelectIndicator />
      </SelectTrigger>
      <SelectContent>
        {OPCIONES.map((o) => (
          <SelectItem key={o.v} id={o.v} textValue={o.l}>
            <Punto clase={o.c} />
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
