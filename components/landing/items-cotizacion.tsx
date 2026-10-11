"use client";

import { useState } from "react";
import { ArrowDownward, ArrowUpward, Plus, Trash1 } from "@tailgrids/icons";
import { BOTON_ICONO } from "@/components/landing/boton-icono";
import { totalItems, type ItemCotizacion, type Proyecto } from "@/lib/landing/tipos";

/* Mismo aspecto que el Input del template, más compacto: son varias filas. */
const CAMPO =
  "w-full min-w-0 rounded-lg border border-card-border bg-input-background px-3 py-2 text-sm text-title-50 outline-none duration-300 placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20";

type Fila = {
  /** Solo para la key de React; el server crea los ids. */
  clave: number;
  title: string;
  detail: string;
  url: string;
  amount: string;
  project_id: string;
};

let siguiente = 0;
const filaDe = (i?: ItemCotizacion): Fila => ({
  clave: siguiente++,
  title: i?.title ?? "",
  detail: i?.detail ?? "",
  url: i?.url ?? "",
  amount: i ? String(i.amount) : "",
  project_id: i?.project_id ?? "",
});

const numero = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Ítems del documento de cotización. Viajan como JSON en el campo `items`;
 * con al menos uno, el total de la cotización pasa a ser su suma.
 */
export function ItemsCotizacion({
  items = [],
  proyectos,
}: {
  items?: ItemCotizacion[];
  proyectos: Pick<Proyecto, "id" | "name">[];
}) {
  const [filas, setFilas] = useState<Fila[]>(() => items.map(filaDe));

  const cambiar = (clave: number, campo: keyof Omit<Fila, "clave">, valor: string) =>
    setFilas((prev) => prev.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  const mover = (i: number, delta: -1 | 1) =>
    setFilas((prev) => {
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const json = JSON.stringify(
    filas.map((f) => ({
      title: f.title,
      detail: f.detail,
      url: f.url,
      amount: f.amount,
      project_id: f.project_id || null,
    })),
  );
  const total = totalItems(filas.map((f) => ({ amount: numero(f.amount) })));

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="items" value={json} />

      {filas.length > 0 && (
        <ol className="flex flex-col gap-2">
          {filas.map((f, i) => (
            <li
              key={f.clave}
              className="flex flex-col gap-2 rounded-lg border border-card-border p-2.5"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_7rem]">
                <input
                  aria-label={`Título del ítem ${i + 1}`}
                  placeholder="Página de Registro"
                  value={f.title}
                  onChange={(e) => cambiar(f.clave, "title", e.target.value)}
                  className={`${CAMPO} font-medium`}
                />
                <input
                  aria-label={`Detalle del ítem ${i + 1}`}
                  placeholder="Detalle (opcional)"
                  value={f.detail}
                  onChange={(e) => cambiar(f.clave, "detail", e.target.value)}
                  className={CAMPO}
                />
                <input
                  aria-label={`Monto del ítem ${i + 1}`}
                  placeholder="0"
                  inputMode="decimal"
                  value={f.amount}
                  onChange={(e) => cambiar(f.clave, "amount", e.target.value)}
                  className={`${CAMPO} text-right tabular-nums`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label={`Link del ítem ${i + 1}`}
                  placeholder="Link del detalle (opcional)"
                  value={f.url}
                  onChange={(e) => cambiar(f.clave, "url", e.target.value)}
                  className={`${CAMPO} flex-1 basis-48`}
                />
                <select
                  aria-label={`Proyecto del ítem ${i + 1}`}
                  value={f.project_id}
                  onChange={(e) => cambiar(f.clave, "project_id", e.target.value)}
                  className={`${CAMPO} flex-1 basis-40`}
                >
                  <option value="">Sin proyecto</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Subir ítem ${i + 1}`}
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                    className={BOTON_ICONO}
                  >
                    <ArrowUpward />
                  </button>
                  <button
                    type="button"
                    aria-label={`Bajar ítem ${i + 1}`}
                    disabled={i === filas.length - 1}
                    onClick={() => mover(i, 1)}
                    className={BOTON_ICONO}
                  >
                    <ArrowDownward />
                  </button>
                  <button
                    type="button"
                    aria-label={`Quitar ítem ${i + 1}`}
                    onClick={() => setFilas((prev) => prev.filter((x) => x.clave !== f.clave))}
                    className={BOTON_ICONO}
                  >
                    <Trash1 />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFilas((prev) => [...prev, filaDe()])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
        >
          <Plus />
          Agregar ítem
        </button>
        {filas.length > 0 && (
          <span className="text-sm text-text-secondary tabular-nums">
            Total de ítems: <strong className="text-text-primary">{total}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
