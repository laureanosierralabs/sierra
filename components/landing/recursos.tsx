"use client";

import { useState } from "react";
import { Link1AngularRight } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { FiltroBotones, type OpcionFiltro } from "@/components/landing/filtro-botones";
import { RecursoFila } from "@/components/landing/recurso-fila";
import { RecursoForm } from "@/components/landing/recurso-form";
import { SeccionTitulo } from "@/components/landing/ui";
import { Card } from "@/components/tailgrids/core/card";
import type { RecursoVista } from "@/lib/landing/datos";
import { TIPOS_RECURSO, LABEL_TIPO_RECURSO, type TipoRecurso } from "@/lib/landing/tipos";

type Filtro = TipoRecurso | "todos";

export function Recursos({
  duenoId,
  tabla = "project",
  titulo = "Recursos del proyecto",
  recursos,
}: {
  duenoId: string;
  tabla?: "project" | "client";
  titulo?: string;
  recursos: RecursoVista[];
}) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  // Filtrar por tipo es lo que categoriza de verdad: las credenciales son un
  // atributo del recurso, no una categoría aparte.
  const presentes = TIPOS_RECURSO.filter((k) => recursos.some((r) => r.kind === k));
  const visibles = filtro === "todos" ? recursos : recursos.filter((r) => r.kind === filtro);

  const opciones: OpcionFiltro<Filtro>[] = [
    { valor: "todos", etiqueta: "Todo", cantidad: recursos.length },
    ...presentes.map((k) => ({
      valor: k,
      etiqueta: LABEL_TIPO_RECURSO[k],
      cantidad: recursos.filter((r) => r.kind === k).length,
    })),
  ];

  return (
    <section>
      <SeccionTitulo
        icono={Link1AngularRight}
        accion={<RecursoForm duenoId={duenoId} tabla={tabla} />}
      >
        {titulo}
      </SeccionTitulo>

      {presentes.length > 1 && (
        <div className="mb-3">
          <FiltroBotones
            etiqueta="Filtrar recursos por tipo"
            opciones={opciones}
            valor={filtro}
            onChange={setFiltro}
          />
        </div>
      )}

      {visibles.length === 0 ? (
        <EmptyState title="Sin recursos cargados" />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-card-border">
            {visibles.map((r) => (
              <RecursoFila key={r.id} recurso={r} duenoId={duenoId} tabla={tabla} />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
