"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { FiltroBotones, type OpcionFiltro } from "@/components/landing/filtro-botones";
import { FiltroSelect } from "@/components/landing/filtro-select";
import { ListaProyectos, type DatosLista } from "@/components/landing/lista-proyectos";
import { useVistaGuardada } from "@/components/landing/vista-guardada";
import type { ResumenCotizado } from "@/lib/landing/datos";
import {
  GRUPOS_PROYECTO,
  LABEL_TIPO_PAGINA,
  TIPOS_PAGINA,
  grupoDe,
  type Cliente,
  type GrupoProyecto,
  type Miembro,
  type Proyecto,
  type TipoPagina,
} from "@/lib/landing/tipos";

const TODOS = "todos";
const TODAS = "todas";

type Filtro = GrupoProyecto | typeof TODOS;

export function VistaProyectos({
  proyectos,
  clientes,
  miembros,
  cotizado,
  verCotizacion,
}: {
  proyectos: Proyecto[];
  clientes: Cliente[];
  miembros: Miembro[];
  cotizado: Map<string, ResumenCotizado>;
  /** Los montos son del owner: un Builder ve el proyecto, no su precio. */
  verCotizacion: boolean;
}) {
  const vista = useVistaGuardada();
  const [filtro, setFiltro] = useState<Filtro>(TODOS);
  const [empresa, setEmpresa] = useState<string>(TODAS);
  const [tipoPagina, setTipoPagina] = useState<string>(TODOS);

  const clientePor = useMemo(() => new Map(clientes.map((c) => [c.id, c.name])), [clientes]);
  const empresaPor = useMemo(() => new Map(clientes.map((c) => [c.id, c.company])), [clientes]);
  const nombreMiembro = useMemo(() => new Map(miembros.map((m) => [m.id, m.nombre])), [miembros]);

  const empresas = [
    ...new Set(clientes.map((c) => c.company).filter((v): v is string => !!v)),
  ].sort((a, b) => a.localeCompare(b, "es"));

  // Solo los tipos que realmente hay: un filtro con opciones vacías es ruido.
  const tiposPresentes = TIPOS_PAGINA.filter((t) => proyectos.some((p) => p.page_type === t));

  const deEmpresa = (p: Proyecto) =>
    empresa === TODAS || (p.client_id ? empresaPor.get(p.client_id) === empresa : false);

  // Los filtros se acumulan: empresa y tipo acotan antes de agrupar por estado.
  const porEmpresa = proyectos
    .filter(deEmpresa)
    .filter((p) => tipoPagina === TODOS || p.page_type === tipoPagina);

  const cuenta = (g: GrupoProyecto) => porEmpresa.filter((p) => grupoDe(p.status) === g).length;

  const visibles =
    filtro === TODOS ? porEmpresa : porEmpresa.filter((p) => grupoDe(p.status) === filtro);

  // Con un filtro activo el encabezado de grupo sería redundante.
  const grupos =
    filtro === TODOS
      ? GRUPOS_PROYECTO.map((g) => ({
          ...g,
          items: porEmpresa.filter((p) => grupoDe(p.status) === g.id),
        })).filter((g) => g.items.length > 0)
      : [];

  const opcionesGrupo: OpcionFiltro<Filtro>[] = [
    { valor: TODOS, etiqueta: "Todos", cantidad: porEmpresa.length },
    ...GRUPOS_PROYECTO.map((g) => ({
      valor: g.id,
      etiqueta: g.label,
      cantidad: cuenta(g.id),
    })).filter((o) => o.cantidad > 0 || o.valor === filtro),
  ];

  const datos: DatosLista = {
    clientes,
    miembros,
    clientePor,
    nombreMiembro,
    cotizado,
    verCotizacion,
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FiltroBotones
          etiqueta="Filtrar por estado"
          opciones={opcionesGrupo}
          valor={filtro}
          onChange={setFiltro}
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

        {tiposPresentes.length > 0 && (
          <FiltroSelect
            etiqueta="Filtrar por tipo de página"
            valor={tipoPagina}
            onChange={setTipoPagina}
            todos={{ valor: TODOS, etiqueta: "Todos los tipos" }}
            opciones={tiposPresentes.map((t: TipoPagina) => ({
              valor: t,
              etiqueta: LABEL_TIPO_PAGINA[t],
            }))}
          />
        )}
      </div>

      {filtro === TODOS ? (
        <div className="flex flex-col gap-8">
          {grupos.map((g) => (
            <section key={g.id} aria-label={g.label}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-title-50">{g.label}</h2>
                <span className="text-xs tabular-nums text-text-tertiary">{g.items.length}</span>
              </div>
              <ListaProyectos vista={vista} proyectos={g.items} datos={datos} />
            </section>
          ))}

          {grupos.length === 0 && <EmptyState title="Todavía no hay proyectos" />}
        </div>
      ) : (
        <ListaProyectos vista={vista} proyectos={visibles} datos={datos} />
      )}
    </>
  );
}
