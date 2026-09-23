"use client";

import { useState } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { guardarMovimiento } from "@/app/finanzas/acciones";
import type { Ambito, Movimiento } from "@/lib/finanzas";
import { hoyISOcliente } from "@/lib/fecha";

const CATEGORIAS_EGRESO = [
  { v: "equipo", l: "Equipo" },
  { v: "suscripcion", l: "Suscripción" },
  { v: "herramienta", l: "Herramienta" },
  { v: "impuesto", l: "Impuesto" },
  { v: "otro", l: "Otro" },
];
const CATEGORIAS_INGRESO = [
  { v: "cliente", l: "Cliente" },
  { v: "otro", l: "Otro" },
];

export function MovimientoForm({
  ambito,
  movimiento,
}: {
  ambito: Ambito;
  movimiento?: Movimiento;
}) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(movimiento);
  const [tipo, setTipo] = useState<"ingreso" | "egreso">(
    movimiento?.tipo ?? "egreso",
  );
  const [enviando, setEnviando] = useState(false);

  const cats = tipo === "egreso" ? CATEGORIAS_EGRESO : CATEGORIAS_INGRESO;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={
          editando
            ? "rounded-md p-1.5 text-text-3 transition-colors hover:bg-surface-2 hover:text-text"
            : "inline-flex items-center gap-2 rounded-lg bg-text px-4 py-2 text-sm font-semibold text-ground transition-opacity hover:opacity-90"
        }
        aria-label={editando ? "Editar movimiento" : "Nuevo movimiento"}
      >
        {editando ? (
          <Pencil className="size-3.5" />
        ) : (
          <>
            <Plus className="size-4" />
            Nuevo movimiento
          </>
        )}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16"
          onClick={() => !enviando && setAbierto(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {editando ? "Editar movimiento" : "Nuevo movimiento"}
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
                await guardarMovimiento(fd);
                setEnviando(false);
                setAbierto(false);
              }}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="ambito" value={ambito} />
              {movimiento && (
                <input type="hidden" name="id" value={movimiento.id} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Tipo">
                  <select
                    name="tipo"
                    value={tipo}
                    onChange={(e) =>
                      setTipo(e.target.value as "ingreso" | "egreso")
                    }
                    className={inputCls}
                  >
                    <option value="egreso">Egreso</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </Campo>
                <Campo label="Fecha">
                  <input
                    type="date"
                    name="fecha"
                    defaultValue={movimiento?.fecha ?? hoyISOcliente()}
                    className={inputCls}
                    required
                  />
                </Campo>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Monto">
                  <input
                    type="number"
                    name="monto"
                    step="0.01"
                    min="0"
                    defaultValue={movimiento?.monto}
                    placeholder="0"
                    className={inputCls}
                    required
                  />
                </Campo>
                <Campo label="Moneda">
                  <select
                    name="moneda"
                    defaultValue={movimiento?.moneda ?? "ARS"}
                    className={inputCls}
                  >
                    <option value="ARS">Pesos (ARS)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </Campo>
              </div>

              <Campo label="Concepto">
                <input
                  type="text"
                  name="concepto"
                  defaultValue={movimiento?.concepto}
                  placeholder="Ej: Pago a Bruno por Lead Magnet"
                  className={inputCls}
                  required
                />
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Categoría">
                  <select
                    name="categoria"
                    defaultValue={movimiento?.categoria ?? cats[0].v}
                    className={inputCls}
                  >
                    {cats.map((c) => (
                      <option key={c.v} value={c.v}>
                        {c.l}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Estado">
                  <select
                    name="estado"
                    defaultValue={movimiento?.estado ?? "pagado"}
                    className={inputCls}
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cobrado">Cobrado</option>
                  </select>
                </Campo>
              </div>

              {ambito === "negocio" && (
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Persona (opcional)">
                    <input
                      type="text"
                      name="persona"
                      defaultValue={movimiento?.persona}
                      placeholder="Bruno, Cielo…"
                      className={inputCls}
                    />
                  </Campo>
                  <Campo label="Cliente (opcional)">
                    <input
                      type="text"
                      name="cliente"
                      defaultValue={movimiento?.cliente}
                      placeholder="Pilar Sousa…"
                      className={inputCls}
                    />
                  </Campo>
                </div>
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

const inputCls =
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
