"use client";

import { useState } from "react";
import { ArrowDownward, ArrowUpward, InfoCircle, Plus, Trash1 } from "@tailgrids/icons";
import { BOTON_ICONO } from "@/components/landing/boton-icono";
import { totalItems, type Cotizacion, type Proyecto } from "@/lib/landing/tipos";

/* Mismo aspecto que el Input del template, más compacto: son varias filas. */
const CAMPO =
  "w-full min-w-0 rounded-lg border border-card-border bg-input-background px-3 py-2 text-sm text-title-50 outline-none duration-300 placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20";

type ProyectoItem = Pick<Proyecto, "id" | "name" | "client_id">;

export type ItemInicial = {
  title: string;
  detail: string;
  url: string;
  amount: string;
  project_id: string;
};

type Fila = ItemInicial & {
  /** Solo para la key de React; el server crea los ids. */
  clave: number;
};

/** "Activación v1 | Aida Qui" → "Activación v1": el cliente ya está en el documento. */
const tituloDe = (p: ProyectoItem) => p.name.split(" | ")[0].trim();

/** Proyecto vinculado sin ítem propio (cotizaciones de antes de los ítems). */
export type VinculoPrevio = { id: string; nombre: string; asignado: number | null };

/**
 * Ítems con los que abre el editor, y los vínculos viejos que no tienen ítem.
 * Esos no se convierten solos: sin monto asignado dejarían la cotización en 0
 * y trabarían el guardado. Se conservan tal cual hasta que se pasen a ítems.
 */
export function itemsIniciales(
  cotizacion: Cotizacion | undefined,
  proyectos: ProyectoItem[],
): { items: ItemInicial[]; previos: VinculoPrevio[] } {
  if (!cotizacion) return { items: [], previos: [] };

  const items: ItemInicial[] = cotizacion.items.map((i) => ({
    title: i.title,
    detail: i.detail ?? "",
    url: i.url ?? "",
    amount: String(i.amount),
    project_id: i.project_id ?? "",
  }));

  const cubiertos = new Set(items.map((i) => i.project_id).filter(Boolean));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p]));
  const previos = cotizacion.project_ids
    .filter((pid) => !cubiertos.has(pid))
    .map((pid) => {
      const p = proyectoPor.get(pid);
      return {
        id: pid,
        // Un proyecto que no llegó en la lista igual se conserva.
        nombre: p ? tituloDe(p) : "Proyecto",
        asignado: cotizacion.allocated[pid] ?? null,
      };
    });
  return { items, previos };
}

let siguiente = 0;
const conClave = (i: ItemInicial): Fila => ({ ...i, clave: siguiente++ });
const vacia = (): ItemInicial => ({ title: "", detail: "", url: "", amount: "", project_id: "" });
const desdeProyecto = (p: ProyectoItem): ItemInicial => ({ ...vacia(), title: tituloDe(p), project_id: p.id });

const numero = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Ítems del documento de cotización. Cada ítem puede ser un proyecto (una
 * landing) o un servicio suelto. Viajan como JSON en el campo `items`; con al
 * menos uno, el total de la cotización es su suma.
 */
export function ItemsCotizacion({
  iniciales,
  previos: previosIniciales = [],
  totalAnterior,
  proyectos,
  clienteId,
  error,
  onCantidad,
}: {
  iniciales: ItemInicial[];
  previos?: VinculoPrevio[];
  /** Total manual actual, para avisar que cambia al pasar a ítems. */
  totalAnterior?: string | null;
  proyectos: ProyectoItem[];
  /** Cliente que paga: filtra los proyectos que se ofrecen. Null = todos. */
  clienteId: string | null;
  error?: string;
  onCantidad?: (cantidad: number) => void;
}) {
  const [filas, setFilas] = useState<Fila[]>(() => iniciales.map(conClave));
  const [previos, setPrevios] = useState(previosIniciales);

  const actualizar = (next: Fila[]) => {
    setFilas(next);
    onCantidad?.(next.length);
  };

  const pasarAItems = () => {
    actualizar([
      ...filas,
      ...previos.map((v) =>
        conClave({
          ...vacia(),
          title: v.nombre,
          amount: v.asignado === null ? "" : String(v.asignado),
          project_id: v.id,
        }),
      ),
    ]);
    setPrevios([]);
  };

  const cambiar = (clave: number, campo: keyof ItemInicial, valor: string) =>
    actualizar(filas.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  const mover = (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= filas.length) return;
    const next = [...filas];
    [next[i], next[j]] = [next[j], next[i]];
    actualizar(next);
  };

  const delCliente = clienteId ? proyectos.filter((p) => p.client_id === clienteId) : proyectos;
  const usados = new Set([
    ...filas.map((f) => f.project_id).filter(Boolean),
    ...previos.map((v) => v.id),
  ]);
  const disponibles = delCliente.filter((p) => !usados.has(p.id));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p]));

  const agregar = (nuevos: ItemInicial[]) => actualizar([...filas, ...nuevos.map(conClave)]);

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

      {previos.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg bg-background-gray-secondary px-3 py-2.5 text-xs text-text-secondary">
          {/* Se mandan como antes (proyecto + monto asignado): guardar sin
              tocarlos los conserva igual. */}
          {previos.map((v) => (
            <span key={v.id} className="contents">
              <input type="hidden" name="project_ids" value={v.id} />
              <input type="hidden" name={`alloc_${v.id}`} value={v.asignado ?? ""} />
            </span>
          ))}
          <p className="flex gap-2 [&>svg]:size-4 [&>svg]:shrink-0">
            <InfoCircle />
            <span>
              Vinculada de antes de los ítems a:{" "}
              <strong className="font-medium text-text-primary">
                {previos.map((v) => v.nombre).join(", ")}
              </strong>
              . Se conservan así al guardar. Pasalos a ítems para que salgan en el documento del
              cliente; el total pasa a ser la suma de los ítems
              {totalAnterior ? ` (hoy: ${totalAnterior})` : ""}.
            </span>
          </p>
          <button
            type="button"
            onClick={pasarAItems}
            className="self-start text-sm font-medium text-primary-500 hover:underline"
          >
            Pasar a ítems
          </button>
        </div>
      )}

      {filas.length > 0 && (
        <ol className="flex flex-col gap-2">
          {filas.map((f, i) => {
            // El proyecto actual se ofrece aunque sea de otro cliente, para
            // no perderlo al cambiar el cliente que paga.
            const actual = f.project_id ? proyectoPor.get(f.project_id) : undefined;
            const opciones =
              actual && !delCliente.includes(actual) ? [actual, ...delCliente] : delCliente;
            return (
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
                  <select
                    aria-label={`Proyecto del ítem ${i + 1}`}
                    value={f.project_id}
                    onChange={(e) => cambiar(f.clave, "project_id", e.target.value)}
                    className={`${CAMPO} flex-1 basis-40`}
                  >
                    <option value="">Sin proyecto (servicio suelto)</option>
                    {opciones.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={`Link del ítem ${i + 1}`}
                    placeholder="Link del detalle (opcional)"
                    value={f.url}
                    onChange={(e) => cambiar(f.clave, "url", e.target.value)}
                    className={`${CAMPO} flex-1 basis-48`}
                  />
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
                      onClick={() => actualizar(filas.filter((x) => x.clave !== f.clave))}
                      className={BOTON_ICONO}
                    >
                      <Trash1 />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => agregar([vacia()])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
        >
          <Plus />
          Agregar ítem
        </button>
        {disponibles.length > 0 && (
          <>
            <select
              aria-label="Agregar un proyecto como ítem"
              value=""
              onChange={(e) => {
                const p = proyectoPor.get(e.target.value);
                if (p) agregar([desdeProyecto(p)]);
              }}
              className={`${CAMPO} w-auto py-1.5`}
            >
              <option value="">+ Agregar proyecto…</option>
              {disponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {clienteId && disponibles.length > 1 && (
              <button
                type="button"
                onClick={() => agregar(disponibles.map(desdeProyecto))}
                className="text-sm font-medium text-primary-500 hover:underline"
              >
                Agregar los {disponibles.length} proyectos del cliente
              </button>
            )}
          </>
        )}
        {filas.length > 0 && (
          <span className="ml-auto text-sm text-text-secondary tabular-nums">
            Total:{" "}
            <strong className="text-text-primary">
              {total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </span>
        )}
      </div>

      {error && <p className="text-sm text-input-error">{error}</p>}
    </div>
  );
}
