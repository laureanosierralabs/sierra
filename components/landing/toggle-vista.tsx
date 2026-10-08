"use client";

import { Layout6, Table2 } from "@tailgrids/icons";
import { ButtonGroup } from "@/components/tailgrids/core/button-group";
import { elegirVista, useVistaGuardada, type VistaProyectos } from "@/components/landing/vista-guardada";

const BOTON =
  "aria-pressed:bg-background-gray-secondary aria-pressed:text-text-primary text-sm font-medium";

const OPCIONES: { valor: VistaProyectos; etiqueta: string; icono: React.ReactNode }[] = [
  { valor: "cards", etiqueta: "Tarjetas", icono: <Layout6 className="size-4" /> },
  { valor: "tabla", etiqueta: "Tabla", icono: <Table2 className="size-4" /> },
];

/** Alterna entre tarjetas y tabla; la elección queda guardada en este navegador. */
export function ToggleVista() {
  const vista = useVistaGuardada();

  return (
    <ButtonGroup variant="secondary" size="sm" role="group" aria-label="Vista de proyectos">
      {OPCIONES.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={vista === o.valor}
          onClick={() => elegirVista(o.valor)}
          className={BOTON}
        >
          {o.icono}
          {o.etiqueta}
        </button>
      ))}
    </ButtonGroup>
  );
}
