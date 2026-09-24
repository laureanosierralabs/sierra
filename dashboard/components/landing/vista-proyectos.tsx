"use client";

import { useState, useSyncExternalStore } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { ProyectoCards } from "@/components/landing/proyecto-cards";
import { ProyectosTabla } from "@/components/landing/proyectos-tabla";
import {
  GRUPOS_PROYECTO,
  grupoDe,
  type GrupoProyecto,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

const CLAVE = "landing:vista-proyectos";
const oyentes = new Set<() => void>();

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
}

function leerGuardada(): "cards" | "tabla" {
  try {
    return localStorage.getItem(CLAVE) === "tabla" ? "tabla" : "cards";
  } catch {
    return "cards";
  }
}

function elegirVista(v: "cards" | "tabla") {
  try {
    localStorage.setItem(CLAVE, v);
  } catch {
    // Modo privado o storage bloqueado: la vista igual funciona.
  }
  oyentes.forEach((cb) => cb());
}

const BOTON =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors";

export function ToggleVista() {
  // El servidor no tiene localStorage: renderiza "cards" y el cliente corrige
  // al hidratar si la preferencia guardada era otra.
  const vista = useSyncExternalStore(suscribir, leerGuardada, () => "cards" as const);

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
      <button
        type="button"
        aria-label="Ver como tarjetas"
        onClick={() => elegirVista("cards")}
        className={`${BOTON} ${vista === "cards" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
      >
        <LayoutGrid className="size-3.5" />
        Cards
      </button>
      <button
        type="button"
        aria-label="Ver como tabla"
        onClick={() => elegirVista("tabla")}
        className={`${BOTON} ${vista === "tabla" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
      >
        <Table2 className="size-3.5" />
        Tabla
      </button>
    </div>
  );
}

export function VistaProyectos({
  proyectos,
  clientes,
  miembros,
}: {
  proyectos: Proyecto[];
  clientes: Cliente[];
  miembros: Miembro[];
}) {
  const vista = useSyncExternalStore(suscribir, leerGuardada, () => "cards" as const);
  const [filtro, setFiltro] = useState<GrupoProyecto | "todos">("todos");
  const [empresa, setEmpresa] = useState<string | "todas">("todas");

  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));
  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const empresaPor = new Map(clientes.map((c) => [c.id, c.company]));

  const empresas = [
    ...new Set(clientes.map((c) => c.company).filter((v): v is string => !!v)),
  ].sort((a, b) => a.localeCompare(b, "es"));

  const deEmpresa = (p: Proyecto) =>
    empresa === "todas" ||
    (p.client_id ? empresaPor.get(p.client_id) === empresa : false);

  const porEmpresa = proyectos.filter(deEmpresa);

  const cuenta = (g: GrupoProyecto) =>
    porEmpresa.filter((p) => grupoDe(p.status) === g).length;

  const visibles =
    filtro === "todos"
      ? porEmpresa
      : porEmpresa.filter((p) => grupoDe(p.status) === filtro);

  // Con un filtro activo el encabezado de grupo sería redundante.
  const grupos =
    filtro === "todos"
      ? GRUPOS_PROYECTO.map((g) => ({
          ...g,
          items: porEmpresa.filter((p) => grupoDe(p.status) === g.id),
        })).filter((g) => g.items.length > 0)
      : [];

  const CHIP =
    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setFiltro("todos")}
          className={`${CHIP} ${filtro === "todos" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
        >
          Todos{" "}
          <span className="tnum text-text-3">{porEmpresa.length}</span>
        </button>

        {GRUPOS_PROYECTO.map((g) => {
          const n = cuenta(g.id);
          if (n === 0 && filtro !== g.id) return null;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setFiltro(g.id)}
              className={`${CHIP} ${filtro === g.id ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
            >
              {g.label} <span className="tnum text-text-3">{n}</span>
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
      </div>

      {filtro === "todos" ? (
        <div className="flex flex-col gap-8">
          {grupos.map((g) => (
            <section key={g.id}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="eyebrow">{g.label}</h2>
                <span className="tnum text-xs text-text-3">
                  {g.items.length}
                </span>
              </div>
              {vista === "cards" ? (
                <ProyectoCards
                  proyectos={g.items}
                  clientePor={clientePor}
                  nombreMiembro={nombreMiembro}
                  clientes={clientes}
                  miembros={miembros}
                />
              ) : (
                <ProyectosTabla
                  proyectos={g.items}
                  clientes={clientes}
                  miembros={miembros}
                  clientePor={clientePor}
                  nombreMiembro={nombreMiembro}
                />
              )}
            </section>
          ))}

          {grupos.length === 0 && (
            <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-text-3">
              Todavía no hay proyectos.
            </p>
          )}
        </div>
      ) : vista === "cards" ? (
        <ProyectoCards
          proyectos={visibles}
          clientePor={clientePor}
          nombreMiembro={nombreMiembro}
          clientes={clientes}
          miembros={miembros}
        />
      ) : (
        <ProyectosTabla
          proyectos={visibles}
          clientes={clientes}
          miembros={miembros}
          clientePor={clientePor}
          nombreMiembro={nombreMiembro}
        />
      )}
    </>
  );
}
