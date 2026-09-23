"use client";

import { BorrarBoton } from "@/components/landing/borrar-boton";
import {
  borrarCliente,
  borrarCotizacion,
  borrarProyecto,
  borrarTarea,
} from "@/app/landing-pages/acciones";

export function BorrarProyecto({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Borrar proyecto"
      advertencia="Borra también sus tareas."
      onConfirmar={() => borrarProyecto(id)}
    />
  );
}

export function BorrarTarea({
  id,
  projectId,
}: {
  id: string;
  projectId?: string;
}) {
  return (
    <BorrarBoton
      etiqueta="Borrar tarea"
      onConfirmar={() => borrarTarea(id, projectId)}
    />
  );
}

export function BorrarCliente({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Borrar cliente"
      advertencia="Sus proyectos quedan sin cliente."
      onConfirmar={() => borrarCliente(id)}
    />
  );
}

export function BorrarCotizacion({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Borrar cotización"
      onConfirmar={() => borrarCotizacion(id)}
    />
  );
}
