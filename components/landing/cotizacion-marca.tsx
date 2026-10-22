"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { moverCotizacionACliente } from "@/app/landing-pages/acciones";
import { Button } from "@/components/tailgrids/core/button";

interface Marca {
  id: string;
  name: string;
}

/** "Oriana opera Aida Qui" con un botón por marca. */
function Aviso({
  operador,
  marcas,
  texto,
  etiqueta,
  pendiente,
  onElegir,
}: {
  operador: string;
  marcas: Marca[];
  texto: string;
  etiqueta: (m: Marca) => string;
  pendiente?: boolean;
  onElegir: (m: Marca) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-badge-blue-background/50 px-3.5 py-3 text-sm text-text-secondary">
      <p>
        <span className="font-medium text-text-primary">{operador}</span> opera{" "}
        {marcas.map((m, i) => (
          <span key={m.id}>
            {i > 0 && (i === marcas.length - 1 ? " y " : ", ")}
            <span className="font-medium text-text-primary">{m.name}</span>
          </span>
        ))}
        . {texto}
      </p>
      <div className="flex flex-wrap gap-2">
        {marcas.map((m) => (
          <Button key={m.id} size="sm" appearance="outline" isDisabled={pendiente} onPress={() => onElegir(m)}>
            {etiqueta(m)}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** En el formulario: si el cliente elegido es un operador, sugiere cargarla a su marca. */
export function SugerenciaMarca({
  operador,
  marcas,
  onElegir,
}: {
  operador: string;
  marcas: Marca[];
  onElegir: (id: string) => void;
}) {
  return (
    <Aviso
      operador={operador}
      marcas={marcas}
      texto="La cotización va a la marca que paga: así aparece en su ficha y en su portal."
      etiqueta={(m) => `Cargar a ${m.name}`}
      onElegir={(m) => onElegir(m.id)}
    />
  );
}

/** En el detalle: una cotización que quedó en el operador se pasa a la marca en un click. */
export function MoverCotizacionAMarca({
  id,
  operador,
  marcas,
}: {
  id: string;
  operador: string;
  marcas: Marca[];
}) {
  const [pendiente, iniciar] = useTransition();
  return (
    <Aviso
      operador={operador}
      marcas={marcas}
      texto="Esta cotización está cargada a la persona, no a la marca que paga: no aparece en la ficha ni en el portal de la marca."
      etiqueta={(m) => `Mover a ${m.name}`}
      pendiente={pendiente}
      onElegir={(m) =>
        iniciar(async () => {
          const r = await moverCotizacionACliente(id, m.id).catch(() => ({ error: "No se pudo mover" }));
          if ("error" in r) toast.error(r.error);
          else toast.success(r.aviso);
        })
      }
    />
  );
}
