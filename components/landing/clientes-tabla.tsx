"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, LayoutGrid, Table2 } from "lucide-react";
import { ClienteCards } from "@/components/landing/cliente-cards";
import { EstadoSelect } from "@/components/landing/estado-select";
import { ClienteForm } from "@/components/landing/cliente-form";
import { BorrarCliente } from "@/components/landing/borrar";
import { VacioTabla } from "@/components/landing/ui";
import {
  ESTADOS_CLIENTE,
  LABEL_ESTADO_CLIENTE,
  LABEL_ORIGEN,
  urlInstagram,
  urlWhatsapp,
  type Cliente,
  type EstadoCliente,
} from "@/lib/landing/tipos";

const COLUMNAS = [
  "Nombre",
  "Empresa",
  "Estado",
  "Origen",
  "WhatsApp",
  "Instagram",
  "",
];

function Fila({ c }: { c: Cliente }) {
  const wa = urlWhatsapp(c.phone);
  const ig = urlInstagram(c.instagram);

  return (
    <tr className="border-b border-line transition-colors last:border-0 hover:bg-surface-2">
      <td className="px-4 py-3 font-medium">
        <Link
          href={`/landing-pages/clients/${c.id}`}
          className="hover:underline"
        >
          {c.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-text-2">{c.company ?? "—"}</td>
      <td className="px-4 py-3">
        <EstadoSelect id={c.id} valor={c.status} tipo="cliente" />
      </td>
      <td className="px-4 py-3">
        {c.source ? (
          <span className="text-xs text-text-2">
            {LABEL_ORIGEN[c.source]}
            {c.source_detail && (
              <span className="text-text-3"> · {c.source_detail}</span>
            )}
          </span>
        ) : (
          <span className="text-xs text-text-3">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-text-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            {c.phone}
            <ExternalLink className="size-3 text-text-3" />
          </a>
        ) : (
          (c.phone ?? "—")
        )}
      </td>
      <td className="px-4 py-3 text-text-2">
        {ig ? (
          <a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            {c.instagram}
            <ExternalLink className="size-3 text-text-3" />
          </a>
        ) : (
          (c.instagram ?? "—")
        )}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center justify-end gap-3">
          <Link
            href={`/landing-pages/clients/${c.id}`}
            aria-label="Ver ficha"
            title="Ver ficha"
            className="text-text-3 transition-colors hover:text-text"
          >
            <ArrowRight className="size-3.5" />
          </Link>
          <ClienteForm cliente={c} />
          <BorrarCliente id={c.id} />
        </span>
      </td>
    </tr>
  );
}

function Tabla({ clientes }: { clientes: Cliente[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {COLUMNAS.map((h, i) => (
              <th
                key={h || i}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 && (
            <VacioTabla colSpan={COLUMNAS.length}>
              Sin contactos en este grupo.
            </VacioTabla>
          )}
          {clientes.map((c) => (
            <Fila key={c.id} c={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientesTabla({ clientes }: { clientes: Cliente[] }) {
  const [estado, setEstado] = useState<EstadoCliente | "todos">("todos");
  const [empresa, setEmpresa] = useState<string | "todas">("todas");
  const [vista, setVista] = useState<"cards" | "tabla">("cards");

  const empresas = [
    ...new Set(clientes.map((c) => c.company).filter((v): v is string => !!v)),
  ].sort((a, b) => a.localeCompare(b, "es"));

  const visibles = clientes.filter(
    (c) =>
      (estado === "todos" || c.status === estado) &&
      (empresa === "todas" || c.company === empresa),
  );

  const CHIP = "rounded-md px-2.5 py-1 text-xs font-medium transition-colors";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setEstado("todos")}
          className={`${CHIP} ${estado === "todos" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
        >
          Todos <span className="tnum text-text-3">{clientes.length}</span>
        </button>
        {ESTADOS_CLIENTE.map((e) => {
          const n = clientes.filter((c) => c.status === e).length;
          if (n === 0 && estado !== e) return null;
          return (
            <button
              key={e}
              type="button"
              onClick={() => setEstado(e)}
              className={`${CHIP} ${estado === e ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
            >
              {LABEL_ESTADO_CLIENTE[e]}{" "}
              <span className="tnum text-text-3">{n}</span>
            </button>
          );
        })}

        {empresas.length > 0 && (
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            aria-label="Filtrar por empresa"
            className="ml-2 rounded-md border border-line bg-surface px-2 py-1 text-xs text-text-2 outline-none transition-colors hover:border-line-strong"
          >
            <option value="todas">Todas las empresas</option>
            {empresas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-line p-0.5">
          <button
            type="button"
            aria-label="Ver como tarjetas"
            onClick={() => setVista("cards")}
            className={`${CHIP} inline-flex items-center gap-1.5 ${vista === "cards" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
          >
            <LayoutGrid className="size-3.5" />
            Cards
          </button>
          <button
            type="button"
            aria-label="Ver como tabla"
            onClick={() => setVista("tabla")}
            className={`${CHIP} inline-flex items-center gap-1.5 ${vista === "tabla" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
          >
            <Table2 className="size-3.5" />
            Tabla
          </button>
        </div>
      </div>

      {vista === "cards" ? (
        <ClienteCards clientes={visibles} />
      ) : (
        <Tabla clientes={visibles} />
      )}
    </>
  );
}
