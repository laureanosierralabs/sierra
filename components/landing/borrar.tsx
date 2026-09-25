"use client";

import { useRouter } from "next/navigation";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import {
  borrarCliente,
  borrarCotizacion,
  borrarProyecto,
  borrarTarea,
} from "@/app/landing-pages/acciones";

export function BorrarProyecto({
  id,
  redirigirA,
}: {
  id: string;
  /** Adónde ir después de borrar, cuando se borra desde el propio detalle. */
  redirigirA?: string;
}) {
  const router = useRouter();

  return (
    <BorrarBoton
      etiqueta="Borrar proyecto"
      advertencia="Borra también sus tareas."
      onConfirmar={async () => {
        await borrarProyecto(id);
        if (redirigirA) router.push(redirigirA);
      }}
    />
  );
}

export function BorrarTarea({
  id,
  projectId,
  redirigirA,
}: {
  id: string;
  projectId?: string;
  redirigirA?: string;
}) {
  const router = useRouter();

  return (
    <BorrarBoton
      etiqueta="Borrar tarea"
      onConfirmar={async () => {
        await borrarTarea(id, projectId);
        if (redirigirA) router.push(redirigirA);
      }}
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
