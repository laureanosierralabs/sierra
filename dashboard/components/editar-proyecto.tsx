"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { editarProyecto } from "@/app/contexto/acciones";
import type { Proyecto } from "@/lib/types";

const ESTADOS = [
  { v: "activo", l: "Activo" },
  { v: "por-empezar", l: "Por empezar" },
  { v: "bloqueado", l: "Bloqueado" },
  { v: "pausado", l: "Pausado" },
  { v: "terminado", l: "Terminado" },
];

export function EditarProyecto({ p }: { p: Proyecto }) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm font-medium text-text-2 transition-colors hover:text-text"
      >
        <Pencil className="size-3.5" />
        Editar
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-12"
          onClick={() => !enviando && setAbierto(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-line bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Editar {p.nombre}</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-md p-1 text-text-3 hover:text-text"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-5 text-xs text-text-3">
              Tu bitácora, decisiones y notas no se tocan. Acá solo cambiás
              el estado operativo.
            </p>

            <form
              action={async (fd) => {
                setEnviando(true);
                await editarProyecto(fd);
                setEnviando(false);
                setAbierto(false);
              }}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="archivo" value={p.archivo} />
              <input type="hidden" name="slug" value={p.slug} />

              <div className="grid grid-cols-3 gap-3">
                <Campo label="Estado">
                  <select name="estado" defaultValue={p.estado} className={cls}>
                    {ESTADOS.map((e) => (
                      <option key={e.v} value={e.v}>
                        {e.l}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Prioridad">
                  <select
                    name="prioridad"
                    defaultValue={p.prioridad}
                    className={cls}
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </Campo>
                <Campo label="Entrega">
                  <input
                    type="date"
                    name="entrega"
                    defaultValue={p.entrega}
                    className={cls}
                  />
                </Campo>
              </div>

              <Campo label="Próximo paso (reemplaza el actual)">
                <input
                  type="text"
                  name="proximoPaso"
                  defaultValue={p.proximoPaso}
                  className={cls}
                  placeholder="Qué sigue"
                />
              </Campo>

              <Campo label="Estado actual (reemplaza el actual)">
                <textarea
                  name="estadoActual"
                  defaultValue={p.estadoActual}
                  rows={3}
                  className={cls}
                  placeholder="Dónde está el proyecto hoy"
                />
              </Campo>

              <Campo label="Agregar a la bitácora (se suma arriba, con fecha)">
                <input
                  type="text"
                  name="bitacora"
                  className={cls}
                  placeholder="Qué pasó hoy — se antepone, no pisa lo anterior"
                />
              </Campo>

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
                  {enviando ? "Guardando…" : "Guardar"}
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
