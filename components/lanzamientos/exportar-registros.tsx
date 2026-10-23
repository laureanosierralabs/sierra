"use client";

import { Download1 } from "@tailgrids/icons";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { slugify } from "@/lib/escritura";
import type { PaginaLanzamiento, Registro } from "@/lib/lanzamientos/tipos";
import {
  COLUMNAS_BASE,
  COLUMNAS_POR_DEFECTO,
  PREFIJO_EXTRA,
  columnasExtra,
  csvRegistros,
} from "@/lib/lanzamientos/vista";

export function descargar(contenido: string, nombre: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta los registros que se están viendo (la landing elegida arriba) con
 * las columnas que se marquen. Se arma en el navegador con los mismos datos
 * que muestra la tabla: no expone nada que la página no tenga ya.
 */
export function ExportarRegistros({
  registros,
  paginas,
  lanzamiento,
  landing,
  periodo = null,
}: {
  registros: Registro[];
  paginas: Pick<PaginaLanzamiento, "id" | "name">[];
  lanzamiento: string;
  /** Nombre de la landing filtrada; null = todas. */
  landing: string | null;
  /** Período filtrado ("Últimos 7 días"); null = todo el lanzamiento. */
  periodo?: string | null;
}) {
  const extras = columnasExtra(registros);

  async function exportar(fd: FormData): Promise<{ error: string } | { aviso: string }> {
    const columnas = fd.getAll("columnas").map(String);
    if (columnas.length === 0) return { error: "Elegí al menos una columna" };
    const nombre = [slugify(lanzamiento) || "lanzamiento", landing ? slugify(landing) : null, periodo ? slugify(periodo) : null]
      .filter(Boolean)
      .join("-");
    descargar(csvRegistros(registros, columnas, paginas), `registros-${nombre}.csv`);
    return { aviso: `${registros.length.toLocaleString("es-AR")} registros exportados` };
  }

  return (
    <DialogoForm
      titulo="Exportar registros"
      action={exportar}
      etiquetaEnviar="Exportar CSV"
      etiquetaEnviando="Exportando…"
      disparador={
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-button-primary-outline-stroke px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background-gray-secondary [&>svg]:size-4">
          <Download1 />
          Exportar
        </span>
      }
    >
      <p className="text-sm text-text-secondary">
        {registros.length.toLocaleString("es-AR")} registros de{" "}
        <strong className="font-medium text-text-primary">{landing ?? "todas las landings"}</strong>
        {periodo ? <> · {periodo.toLowerCase()}</> : null}. Para exportar otra cosa, cambiá los filtros de arriba.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-input-label-text">Columnas</legend>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {COLUMNAS_BASE.map((c) => (
            <Checkbox
              key={c.id}
              name="columnas"
              value={c.id}
              defaultSelected={COLUMNAS_POR_DEFECTO.includes(c.id)}
            >
              <span className="text-sm text-text-primary">{c.etiqueta}</span>
            </Checkbox>
          ))}
        </div>
      </fieldset>

      {extras.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-input-label-text">
            Datos importados del formulario
          </legend>
          <div className="grid max-h-48 grid-cols-1 gap-x-4 gap-y-2 overflow-y-auto sm:grid-cols-2">
            {extras.map((k) => (
              <Checkbox key={k} name="columnas" value={`${PREFIJO_EXTRA}${k}`}>
                <span className="truncate text-sm text-text-primary">{k}</span>
              </Checkbox>
            ))}
          </div>
        </fieldset>
      )}
    </DialogoForm>
  );
}
