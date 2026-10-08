"use client";

import { Pencil1 } from "@tailgrids/icons";
import { DialogoForm } from "@/components/landing/dialogo-form";
import {
  ProyectoCampos,
  type DesdeCotizacion,
} from "@/components/landing/proyecto-campos";
import { SIN_OPCION, proyectoEsquema } from "@/components/landing/proyecto-esquema";
import { guardarProyecto } from "@/app/landing-pages/acciones";
import type { Cliente, Miembro, Proceso, Proyecto } from "@/lib/landing/tipos";

export type { DesdeCotizacion };

/** Mismo FormData que antes: "ninguno" viaja como cadena vacía. */
function guardar(fd: FormData) {
  for (const campo of ["client_id", "stage", "page_type"]) {
    if (fd.get(campo) === SIN_OPCION) fd.set(campo, "");
  }
  return guardarProyecto(fd);
}

export function ProyectoForm({
  miembros,
  clientes,
  procesos = [],
  proyecto,
  desdeCotizacion,
  etiqueta,
  disparador,
}: {
  miembros: Miembro[];
  clientes: Pick<Cliente, "id" | "name">[];
  procesos?: Pick<Proceso, "id" | "slug" | "name">[];
  proyecto?: Proyecto;
  desdeCotizacion?: DesdeCotizacion;
  etiqueta?: string;
  disparador?: React.ReactNode;
}) {
  const editar = Boolean(proyecto);

  return (
    <DialogoForm
      titulo={editar ? "Editar proyecto" : "Nuevo proyecto"}
      etiquetaAbrir={etiqueta ?? "Nuevo proyecto"}
      action={guardar}
      schema={proyectoEsquema}
      disparador={disparador ?? (editar ? <Pencil1 /> : undefined)}
    >
      {(form) => (
        <ProyectoCampos
          form={form}
          miembros={miembros}
          clientes={clientes}
          procesos={procesos}
          proyecto={proyecto}
          desdeCotizacion={desdeCotizacion}
        />
      )}
    </DialogoForm>
  );
}
