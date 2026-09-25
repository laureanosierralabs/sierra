"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { crearProyecto, crearCliente } from "@/app/contexto/acciones";

type Tipo = "proyecto" | "cliente";

export function CrearEntidad({
  unidad,
  tipo,
}: {
  unidad: string;
  tipo: Tipo;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const esProyecto = tipo === "proyecto";

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-2 transition-colors hover:text-text"
      >
        <Plus className="size-3.5" />
        {esProyecto ? "Nuevo proyecto" : "Nuevo cliente"}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16"
          onClick={() => !enviando && setAbierto(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {esProyecto ? "Nuevo proyecto" : "Nuevo cliente"}
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-md p-1 text-text-3 hover:text-text"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              action={async (fd) => {
                setEnviando(true);
                if (esProyecto) await crearProyecto(fd);
                else await crearCliente(fd);
                setEnviando(false);
                setAbierto(false);
              }}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="unidad" value={unidad} />

              <Campo label="Nombre">
                <input
                  type="text"
                  name="nombre"
                  className={cls}
                  placeholder={esProyecto ? "Landing nueva" : "Nombre del cliente"}
                  required
                  autoFocus
                />
              </Campo>

              {esProyecto ? (
                <>
                  <Campo label="Cliente (opcional)">
                    <input type="text" name="cliente" className={cls} />
                  </Campo>
                  <Campo label="Entrega (opcional)">
                    <input type="date" name="entrega" className={cls} />
                  </Campo>
                  <Campo label="Próximo paso (opcional)">
                    <input type="text" name="proximoPaso" className={cls} />
                  </Campo>
                </>
              ) : (
                <Campo label="Contexto (opcional)">
                  <textarea name="contexto" rows={3} className={cls} />
                </Campo>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-lg px-4 py-2 text-sm text-text-2 hover:text-text"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-lg bg-text px-4 py-2 text-sm font-semibold text-ground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {enviando ? "Creando…" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const cls =
  "w-full rounded-lg border border-line bg-ground px-3 py-2 text-sm text-text outline-none transition-colors focus:border-border-strong";

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-text-3">{label}</span>
      {children}
    </label>
  );
}
