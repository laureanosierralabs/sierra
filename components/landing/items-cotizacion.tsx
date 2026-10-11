"use client";

import { useState } from "react";
import {
  ArrowDownward,
  ArrowUpward,
  InfoCircle,
  Plus,
  Trash1,
} from "@tailgrids/icons";
import { BOTON_ICONO } from "@/components/landing/boton-icono";
import {
  parsearDescuento,
  resumenPrecio,
  totalItems,
  type Cotizacion,
  type Proyecto,
} from "@/lib/landing/tipos";

/* Mismo aspecto que el Input del template, más compacto: son varias filas. */
const CAMPO =
  "w-full min-w-0 rounded-lg border border-card-border bg-input-background px-3 py-2 text-sm text-title-50 outline-none duration-300 placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20";

const ENLACE = "text-sm font-medium text-primary-500 hover:underline";

type ProyectoItem = Pick<Proyecto, "id" | "name" | "client_id" | "site_url">;

export type ItemInicial = {
  title: string;
  detail: string;
  url: string;
  amount: string;
  project_id: string;
  is_extension: boolean;
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
 * Estado con el que abre el editor: los ítems, los vínculos viejos sin ítem
 * (no se convierten solos: sin monto trabarían el guardado) y el descuento
 * vigente, que es la diferencia entre la suma de los ítems y el total.
 */
export function itemsIniciales(
  cotizacion: Cotizacion | undefined,
  proyectos: ProyectoItem[],
): { items: ItemInicial[]; previos: VinculoPrevio[]; descuento: string } {
  if (!cotizacion) return { items: [], previos: [], descuento: "" };

  const items: ItemInicial[] = cotizacion.items.map((i) => ({
    title: i.title,
    detail: i.detail ?? "",
    url: i.url ?? "",
    amount: i.amount === 0 ? "" : String(i.amount),
    project_id: i.project_id ?? "",
    is_extension: i.is_extension,
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

  const { descuento } = resumenPrecio(cotizacion.items, cotizacion.total_amount);
  return { items, previos, descuento: descuento > 0 ? String(descuento) : "" };
}

let siguiente = 0;
const conClave = (i: ItemInicial): Fila => ({ ...i, clave: siguiente++ });
const vacia = (extension = false): ItemInicial => ({
  title: "",
  detail: "",
  url: "",
  amount: "",
  project_id: "",
  is_extension: extension,
});
const desdeProyecto = (p: ProyectoItem): ItemInicial => ({
  ...vacia(),
  title: tituloDe(p),
  // El título del documento linkea a la web publicada del proyecto.
  url: p.site_url ?? "",
  project_id: p.id,
});

const numero = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const dinero = (n: number, moneda: string) =>
  `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda}`;

/** Índices [inicio, fin) del bloque de un ítem principal: él y sus extensiones. */
function bloque(filas: Fila[], inicio: number): [number, number] {
  let fin = inicio + 1;
  while (fin < filas.length && filas[fin].is_extension) fin++;
  return [inicio, fin];
}

/**
 * Ítems del documento de cotización. Un ítem es un proyecto (una landing) o
 * un servicio suelto; una extensión cuelga de un ítem (una integración, una
 * automatización) y hereda su proyecto. Viajan como JSON en `items`; con al
 * menos uno, el total es la suma menos el descuento por paquete.
 */
export function ItemsCotizacion({
  iniciales,
  previos: previosIniciales = [],
  descuentoInicial = "",
  totalAnterior,
  proyectos,
  clienteId,
  moneda,
  error,
  onCantidad,
}: {
  iniciales: ItemInicial[];
  previos?: VinculoPrevio[];
  descuentoInicial?: string;
  /** Total manual actual, para avisar que cambia al pasar a ítems. */
  totalAnterior?: string | null;
  proyectos: ProyectoItem[];
  /** Cliente que paga: filtra los proyectos que se ofrecen. Null = todos. */
  clienteId: string | null;
  moneda: string;
  error?: string;
  onCantidad?: (cantidad: number) => void;
}) {
  const [filas, setFilas] = useState<Fila[]>(() => iniciales.map(conClave));
  const [previos, setPrevios] = useState(previosIniciales);
  const [descuento, setDescuento] = useState(descuentoInicial);

  const proyectoPor = new Map(proyectos.map((p) => [p.id, p]));

  const actualizar = (next: Fila[]) => {
    setFilas(next);
    onCantidad?.(next.length);
  };

  const cambiar = (clave: number, campo: keyof ItemInicial, valor: string) =>
    actualizar(filas.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  /**
   * Elegir proyecto trae su web como link, salvo que el link ya se haya
   * escrito a mano (distinto de la web del proyecto anterior).
   */
  const elegirProyecto = (clave: number, pid: string) =>
    actualizar(
      filas.map((f) => {
        if (f.clave !== clave) return f;
        const webAnterior = proyectoPor.get(f.project_id)?.site_url ?? "";
        const manual = f.url !== "" && f.url !== webAnterior;
        const web = proyectoPor.get(pid)?.site_url ?? "";
        return { ...f, project_id: pid, url: manual ? f.url : web };
      }),
    );

  /** Mueve el ítem principal junto con sus extensiones. */
  const mover = (i: number, delta: -1 | 1) => {
    const [ini, fin] = bloque(filas, i);
    const propio = filas.slice(ini, fin);
    const resto = [...filas.slice(0, ini), ...filas.slice(fin)];
    // Inicio del bloque vecino en `resto`.
    const principales = resto.flatMap((f, k) => (f.is_extension ? [] : [k]));
    const posicion = principales.filter((k) => k < ini).length;
    const destino = posicion + delta;
    if (destino < 0 || destino > principales.length) return;
    const corte = destino === principales.length ? resto.length : principales[destino];
    actualizar([...resto.slice(0, corte), ...propio, ...resto.slice(corte)]);
  };

  /** Quitar un ítem principal se lleva sus extensiones: solas no tienen sentido. */
  const quitar = (i: number) => {
    const [ini, fin] = filas[i].is_extension ? [i, i + 1] : bloque(filas, i);
    actualizar([...filas.slice(0, ini), ...filas.slice(fin)]);
  };

  const agregarExtension = (i: number) => {
    const [, fin] = bloque(filas, i);
    actualizar([...filas.slice(0, fin), conClave(vacia(true)), ...filas.slice(fin)]);
  };

  const pasarAItems = () => {
    actualizar([
      ...filas,
      ...previos.map((v) =>
        conClave({
          ...vacia(),
          title: v.nombre,
          amount: v.asignado === null ? "" : String(v.asignado),
          url: proyectoPor.get(v.id)?.site_url ?? "",
          project_id: v.id,
        }),
      ),
    ]);
    setPrevios([]);
  };

  const delCliente = clienteId ? proyectos.filter((p) => p.client_id === clienteId) : proyectos;
  const usados = new Set([
    ...filas.filter((f) => !f.is_extension).map((f) => f.project_id).filter(Boolean),
    ...previos.map((v) => v.id),
  ]);
  const disponibles = delCliente.filter((p) => !usados.has(p.id));

  const agregar = (nuevos: ItemInicial[]) => actualizar([...filas, ...nuevos.map(conClave)]);

  const json = JSON.stringify(
    filas.map((f) => ({
      title: f.title,
      detail: f.detail,
      url: f.url,
      amount: f.amount,
      project_id: f.is_extension ? null : f.project_id || null,
      is_extension: f.is_extension,
    })),
  );

  const subtotal = totalItems(filas.map((f) => ({ amount: numero(f.amount) })));
  const montoDescuento = parsearDescuento(descuento, subtotal);
  const total = subtotal - (montoDescuento ?? 0);
  // Número de ítem principal y título del padre de cada fila, calculados
  // antes de renderizar.
  const meta: { n: number; padre: string }[] = [];
  for (const f of filas) {
    const previo = meta[meta.length - 1];
    if (f.is_extension) meta.push({ n: previo?.n ?? 1, padre: previo?.padre ?? "" });
    else meta.push({ n: (previo?.n ?? 0) + 1, padre: f.title });
  }
  const principales = meta.length > 0 ? meta[meta.length - 1].n : 0;

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
          <button type="button" onClick={pasarAItems} className={`self-start ${ENLACE}`}>
            Pasar a ítems
          </button>
        </div>
      )}

      {filas.length > 0 && (
        <>
          <div
            aria-hidden="true"
            className="hidden px-2.5 text-xs font-medium text-text-tertiary sm:grid sm:grid-cols-[1fr_1fr_8.5rem] sm:gap-2"
          >
            <span>Ítem</span>
            <span>Detalle</span>
            <span className="text-right">Precio ({moneda})</span>
          </div>
          <ol className="flex flex-col gap-2">
            {filas.map((f, i) => {
              const { n, padre } = meta[i];
              const nombre = f.is_extension ? `extensión del ítem ${n}` : `ítem ${n}`;
              // El proyecto actual se ofrece aunque sea de otro cliente, para
              // no perderlo al cambiar el cliente que paga.
              const actual = f.project_id ? proyectoPor.get(f.project_id) : undefined;
              const opciones =
                actual && !delCliente.includes(actual) ? [actual, ...delCliente] : delCliente;
              return (
                <li
                  key={f.clave}
                  className={
                    f.is_extension
                      ? "ml-5 flex flex-col gap-2 rounded-lg border border-dashed border-card-border p-2.5"
                      : "flex flex-col gap-2 rounded-lg border border-card-border p-2.5"
                  }
                >
                  {f.is_extension && (
                    <span className="text-xs font-medium text-text-tertiary">
                      ↳ Extensión de {padre || `ítem ${n}`}
                    </span>
                  )}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_8.5rem]">
                    <input
                      aria-label={`Título del ${nombre}`}
                      placeholder={f.is_extension ? "Integración con GHL" : "Página de Registro"}
                      value={f.title}
                      onChange={(e) => cambiar(f.clave, "title", e.target.value)}
                      className={`${CAMPO} font-medium`}
                    />
                    <input
                      aria-label={`Detalle del ${nombre}`}
                      placeholder={f.is_extension ? "Automatización de emails" : "Detalle (opcional)"}
                      value={f.detail}
                      onChange={(e) => cambiar(f.clave, "detail", e.target.value)}
                      className={CAMPO}
                    />
                    <label className="relative">
                      <span className="sr-only">Precio del {nombre}</span>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-text-tertiary"
                      >
                        $
                      </span>
                      <input
                        placeholder="Incluido"
                        inputMode="decimal"
                        value={f.amount}
                        onChange={(e) => cambiar(f.clave, "amount", e.target.value)}
                        className={`${CAMPO} pl-7 text-right tabular-nums`}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!f.is_extension && (
                      <select
                        aria-label={`Proyecto del ${nombre}`}
                        value={f.project_id}
                        onChange={(e) => elegirProyecto(f.clave, e.target.value)}
                        className={`${CAMPO} flex-1 basis-40`}
                      >
                        <option value="">Sin proyecto (servicio suelto)</option>
                        {opciones.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      aria-label={`Link del ${nombre}`}
                      placeholder={f.is_extension ? "Link (opcional)" : "Link de la web (se completa con la del proyecto)"}
                      value={f.url}
                      onChange={(e) => cambiar(f.clave, "url", e.target.value)}
                      className={`${CAMPO} flex-1 basis-48`}
                    />
                    <span className="ml-auto flex items-center gap-1">
                      {!f.is_extension && (
                        <>
                          <button
                            type="button"
                            onClick={() => agregarExtension(i)}
                            className="mr-1 text-xs font-medium text-primary-500 hover:underline"
                          >
                            + Extensión
                          </button>
                          <button
                            type="button"
                            aria-label={`Subir ${nombre}`}
                            disabled={n === 1}
                            onClick={() => mover(i, -1)}
                            className={BOTON_ICONO}
                          >
                            <ArrowUpward />
                          </button>
                          <button
                            type="button"
                            aria-label={`Bajar ${nombre}`}
                            disabled={n === principales}
                            onClick={() => mover(i, 1)}
                            className={BOTON_ICONO}
                          >
                            <ArrowDownward />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        aria-label={`Quitar ${nombre}`}
                        title={
                          !f.is_extension && filas[i + 1]?.is_extension
                            ? "Quita también sus extensiones"
                            : undefined
                        }
                        onClick={() => quitar(i)}
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
        </>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => agregar([vacia()])}
          className={`inline-flex items-center gap-1.5 [&>svg]:size-4 ${ENLACE}`}
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
                className={ENLACE}
              >
                Agregar los {disponibles.length} proyectos del cliente
              </button>
            )}
          </>
        )}
      </div>

      {filas.length > 0 && (
        <dl className="ml-auto grid w-full max-w-xs grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-lg border border-card-border p-3 text-sm tabular-nums">
          <dt className="text-text-secondary">Subtotal</dt>
          <dd className="text-right">{dinero(subtotal, moneda)}</dd>
          <dt>
            <label htmlFor="descuento-paquete" className="text-text-secondary">
              Descuento por paquete
            </label>
          </dt>
          <dd>
            <input
              id="descuento-paquete"
              name="discount"
              placeholder="80 o 10%"
              inputMode="decimal"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              className={`${CAMPO} w-28 py-1 text-right`}
            />
          </dd>
          {montoDescuento ? (
            <>
              <dt className="text-xs text-text-tertiary">Se descuenta</dt>
              <dd className="text-right text-xs text-text-tertiary">
                − {dinero(montoDescuento, moneda)}
              </dd>
            </>
          ) : null}
          <dt className="border-t border-card-border pt-1.5 font-medium text-text-primary">Total</dt>
          <dd className="border-t border-card-border pt-1.5 text-right font-semibold text-text-primary">
            {dinero(Math.max(total, 0), moneda)}
          </dd>
        </dl>
      )}

      {error && <p className="text-sm text-input-error">{error}</p>}
    </div>
  );
}
