"use client";

import { ProyectoCards } from "@/components/landing/proyecto-cards";
import { ProyectosTabla } from "@/components/landing/proyectos-tabla";
import type { VistaProyectos } from "@/components/landing/vista-guardada";
import type { ResumenCotizado } from "@/lib/landing/datos";
import type { Cliente, Miembro, Proyecto } from "@/lib/landing/tipos";

export interface DatosLista {
  clientes: Cliente[];
  miembros: Miembro[];
  clientePor: Map<string, string>;
  nombreMiembro: Map<string, string>;
  cotizado: Map<string, ResumenCotizado>;
  verCotizacion: boolean;
}

/** Los mismos proyectos como tarjetas o como tabla, según la vista elegida. */
export function ListaProyectos({
  vista,
  proyectos,
  datos,
}: {
  vista: VistaProyectos;
  proyectos: Proyecto[];
  datos: DatosLista;
}) {
  return vista === "cards" ? (
    <ProyectoCards proyectos={proyectos} {...datos} />
  ) : (
    <ProyectosTabla proyectos={proyectos} {...datos} />
  );
}
