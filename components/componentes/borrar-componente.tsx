"use client";

import { useRouter } from "next/navigation";
import { borrarComponente } from "@/app/landing-pages/componentes-acciones";
import { BorrarBoton } from "@/components/landing/borrar-boton";

/** Borra desde el detalle y vuelve a la biblioteca. Solo se muestra al owner. */
export function BorrarComponente({ id }: { id: string }) {
  const router = useRouter();

  return (
    <BorrarBoton
      etiqueta="Borrar componente"
      onConfirmar={async () => {
        const r = await borrarComponente(id);
        // ConfirmDialog muestra el mensaje de lo que se lance.
        if (r?.error) throw new Error(r.error);
        router.push("/landing-pages/componentes");
      }}
    />
  );
}
