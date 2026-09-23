"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoCliente } from "@/app/contexto/acciones";

const OPCIONES = [
  { v: "activo", l: "Activo", c: "text-ok" },
  { v: "stand-by", l: "Stand by", c: "text-warn" },
  { v: "inactivo", l: "Inactivo", c: "text-text-3" },
  { v: "prospecto", l: "Prospecto", c: "text-idle" },
];

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
  const color = OPCIONES.find((o) => o.v === valor)?.c ?? "text-text-2";

  return (
    <select
      value={valor}
      disabled={pendiente}
      onChange={(e) => {
        const nuevo = e.target.value;
        setValor(nuevo);
        startTransition(() =>
          cambiarEstadoCliente(archivo, nuevo, slug, unidad),
        );
      }}
      className={`cursor-pointer rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium outline-none ${color}`}
      aria-label="Estado del cliente"
    >
      {OPCIONES.map((o) => (
        <option key={o.v} value={o.v} className="bg-surface text-text">
          {o.l}
        </option>
      ))}
    </select>
  );
}
