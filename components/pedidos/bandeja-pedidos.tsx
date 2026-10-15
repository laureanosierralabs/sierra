"use client";

import { useState } from "react";
import { FiltroSelect } from "@/components/landing/filtro-select";
import { ListaPedidos } from "@/components/pedidos/pedido-ui";
import { Card } from "@/components/tailgrids/core/card";
import { estaCerrado, type Pedido } from "@/lib/pedidos/tipos";

type PedidoConCliente = Pedido & { cliente: string };

/* Qué se mira: lo que tiene la pelota del equipo, lo que espera al cliente, o el historial. */
const VISTAS = [
  { valor: "pendientes", etiqueta: "Para el equipo" },
  { valor: "cliente", etiqueta: "Esperan al cliente" },
  { valor: "cerrados", etiqueta: "Cerrados" },
] as const;
type Vista = (typeof VISTAS)[number]["valor"] | "todos";

function enVista(p: Pedido, vista: Vista): boolean {
  if (vista === "todos") return true;
  if (vista === "cerrados") return estaCerrado(p.status);
  // Una aprobación abierta la tiene que resolver el cliente.
  const esperaCliente = p.kind === "aprobacion" && p.status === "abierta";
  return !estaCerrado(p.status) && (vista === "cliente" ? esperaCliente : !esperaCliente);
}

/** Bandeja del panel: pedidos de todos los clientes, filtrables. Urgentes primero. */
export function BandejaPedidos({ pedidos }: { pedidos: PedidoConCliente[] }) {
  const [vista, setVista] = useState<Vista>("pendientes");
  const [cliente, setCliente] = useState("todos");

  const clientes = [...new Map(pedidos.map((p) => [p.client_id, p.cliente])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1], "es"),
  );
  const visibles = pedidos
    .filter((p) => enVista(p, vista) && (cliente === "todos" || p.client_id === cliente))
    .sort((a, b) => Number(b.priority === "urgente") - Number(a.priority === "urgente"));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <FiltroSelect
          etiqueta="Estado"
          valor={vista}
          onChange={(v) => setVista(v as Vista)}
          todos={{ valor: "todos", etiqueta: "Todos" }}
          opciones={VISTAS.map((v) => ({ valor: v.valor, etiqueta: v.etiqueta }))}
        />
        {clientes.length > 1 && (
          <FiltroSelect
            etiqueta="Cliente"
            valor={cliente}
            onChange={setCliente}
            todos={{ valor: "todos", etiqueta: "Todos los clientes" }}
            opciones={clientes.map(([id, nombre]) => ({ valor: id, etiqueta: nombre }))}
          />
        )}
      </div>
      <Card className="overflow-hidden p-0">
        <ListaPedidos
          pedidos={visibles}
          href={(id) => `/landing-pages/pedidos/${id}`}
          vacio={vista === "pendientes" ? "No hay nada pendiente para el equipo." : "No hay pedidos acá."}
          cliente
        />
      </Card>
    </div>
  );
}
