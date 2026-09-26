"use client";

import { useState } from "react";
import { ListChecks, Workflow } from "lucide-react";

const TAB =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150";
const TAB_ACTIVO = "bg-surface text-text shadow-e1";
const TAB_INACTIVO = "text-text-2 hover:bg-surface/60 hover:text-text";

/** Alterna entre las tareas reales y los SOPs que las generan. */
export function VistaTareas({
  tareas,
  procesos,
}: {
  tareas: React.ReactNode;
  procesos: React.ReactNode;
}) {
  const [vista, setVista] = useState<"tareas" | "procesos">("tareas");

  return (
    <>
      <div className="mb-4 flex w-fit items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5">
        <button
          type="button"
          onClick={() => setVista("tareas")}
          className={`${TAB} ${vista === "tareas" ? TAB_ACTIVO : TAB_INACTIVO}`}
        >
          <ListChecks className="size-3.5" />
          Tareas
        </button>
        <button
          type="button"
          onClick={() => setVista("procesos")}
          className={`${TAB} ${vista === "procesos" ? TAB_ACTIVO : TAB_INACTIVO}`}
        >
          <Workflow className="size-3.5" />
          Procesos
        </button>
      </div>

      {vista === "tareas" ? tareas : procesos}
    </>
  );
}
