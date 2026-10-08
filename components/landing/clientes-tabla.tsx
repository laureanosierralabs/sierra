"use client";

import { useMemo, useState } from "react";
import { Layout6, Table2 } from "@tailgrids/icons";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ClienteCards } from "@/components/landing/cliente-cards";
import { crearColumnasClientes } from "@/components/landing/clientes-columnas";
import { FiltroBotones, type OpcionFiltro } from "@/components/landing/filtro-botones";
import { FiltroSelect } from "@/components/landing/filtro-select";
import { ButtonGroup } from "@/components/tailgrids/core/button-group";
import {
  ESTADOS_CLIENTE,
  LABEL_ESTADO_CLIENTE,
  type Cliente,
  type EstadoCliente,
} from "@/lib/landing/tipos";

const TODOS = "todos";
const TODAS = "todas";

type Filtro = EstadoCliente | typeof TODOS;
type Vista = "cards" | "tabla";

const BOTON =
  "aria-pressed:bg-background-gray-secondary aria-pressed:text-text-primary text-sm font-medium";

const VISTAS: { valor: Vista; etiqueta: string; aria: string; icono: React.ReactNode }[] = [
  { valor: "cards", etiqueta: "Cards", aria: "Ver como tarjetas", icono: <Layout6 className="size-4" /> },
  { valor: "tabla", etiqueta: "Tabla", aria: "Ver como tabla", icono: <Table2 className="size-4" /> },
];

const OBTENER_ID = (c: Cliente) => c.id;
const IR_A_LA_FICHA = (c: Cliente) => `/landing-pages/clients/${c.id}`;

export function ClientesTabla({ clientes }: { clientes: Cliente[] }) {
  const [estado, setEstado] = useState<Filtro>(TODOS);
  const [empresa, setEmpresa] = useState<string>(TODAS);
  const [vista, setVista] = useState<Vista>("cards");

  const columnas = useMemo(() => crearColumnasClientes(), []);

  const empresas = [
    ...new Set(clientes.map((c) => c.company).filter((v): v is string => !!v)),
  ].sort((a, b) => a.localeCompare(b, "es"));

  const visibles = clientes.filter(
    (c) =>
      (estado === TODOS || c.status === estado) && (empresa === TODAS || c.company === empresa),
  );

  // Un estado sin contactos solo se ofrece si es el que está activo.
  const opciones: OpcionFiltro<Filtro>[] = [
    { valor: TODOS, etiqueta: "Todos", cantidad: clientes.length },
    ...ESTADOS_CLIENTE.map((e) => ({
      valor: e,
      etiqueta: LABEL_ESTADO_CLIENTE[e],
      cantidad: clientes.filter((c) => c.status === e).length,
    })).filter((o) => o.cantidad > 0 || o.valor === estado),
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FiltroBotones
          etiqueta="Filtrar por estado"
          opciones={opciones}
          valor={estado}
          onChange={setEstado}
        />

        {empresas.length > 0 && (
          <FiltroSelect
            etiqueta="Filtrar por empresa"
            valor={empresa}
            onChange={setEmpresa}
            todos={{ valor: TODAS, etiqueta: "Todas las empresas" }}
            opciones={empresas.map((e) => ({ valor: e, etiqueta: e }))}
          />
        )}

        <ButtonGroup
          variant="secondary"
          size="sm"
          role="group"
          aria-label="Vista de clientes"
          className="ml-auto"
        >
          {VISTAS.map((v) => (
            <button
              key={v.valor}
              type="button"
              aria-label={v.aria}
              aria-pressed={vista === v.valor}
              onClick={() => setVista(v.valor)}
              className={BOTON}
            >
              {v.icono}
              {v.etiqueta}
            </button>
          ))}
        </ButtonGroup>
      </div>

      {vista === "cards" ? (
        <ClienteCards clientes={visibles} />
      ) : (
        <DataTable
          columns={columnas}
          data={visibles}
          label="Clientes"
          getRowId={OBTENER_ID}
          getRowHref={IR_A_LA_FICHA}
          emptyState={<EmptyState variant="inline">Sin contactos en este grupo.</EmptyState>}
        />
      )}
    </>
  );
}
