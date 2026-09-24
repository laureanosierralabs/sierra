"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { guardarCampoTarea } from "@/app/landing-pages/acciones";
import type {
  Campo,
  Contenido,
  ItemChecklist,
  Plantilla,
  ValorCampo,
} from "@/lib/landing/plantillas";

function Opciones({
  campo,
  valor,
  onCambio,
}: {
  campo: Campo;
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  const marcadas = Array.isArray(valor) ? valor : valor ? [valor] : [];

  function alternar(opcion: string) {
    if (!campo.multiple) {
      // Una sola opción: volver a tocarla la desmarca.
      onCambio(marcadas[0] === opcion ? null : opcion);
      return;
    }
    onCambio(
      marcadas.includes(opcion)
        ? marcadas.filter((v) => v !== opcion)
        : [...marcadas, opcion],
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {campo.opciones?.map((o) => {
        const activa = marcadas.includes(o);
        return (
          <label
            key={o}
            className="flex cursor-pointer items-center gap-2 text-sm text-text-2 transition-colors hover:text-text"
          >
            <input
              type={campo.multiple ? "checkbox" : "radio"}
              name={campo.id}
              checked={activa}
              onChange={() => alternar(o)}
              className="size-3.5 accent-idle"
            />
            <span className={activa ? "text-text" : ""}>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

function Item({
  texto,
  hecho,
  onAlternar,
}: {
  texto: string;
  hecho: boolean;
  onAlternar: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-surface-2">
      <input
        type="checkbox"
        checked={hecho}
        onChange={onAlternar}
        className="mt-0.5 size-3.5 shrink-0 accent-ok"
      />
      <span className={hecho ? "text-text-3 line-through" : "text-text-2"}>
        {texto}
      </span>
    </label>
  );
}

function Checklist({
  campo,
  valor,
  onCambio,
}: {
  campo: Campo;
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  const hechos = Array.isArray(valor) ? valor : [];

  // Un checklist plano se normaliza a la misma forma que uno anidado.
  const items: ItemChecklist[] =
    campo.items ?? (campo.opciones ?? []).map((texto) => ({ texto }));
  const total = items.reduce((n, i) => n + 1 + (i.hijos?.length ?? 0), 0);

  function alternar(item: string) {
    onCambio(
      hechos.includes(item)
        ? hechos.filter((v) => v !== item)
        : [...hechos, item],
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-ok transition-all"
            style={{ width: total ? `${(hechos.length / total) * 100}%` : "0%" }}
          />
        </div>
        <span className="tnum shrink-0 text-xs text-text-3">
          {hechos.length}/{total}
        </span>
      </div>

      <div className="flex flex-col">
        {items.map((item) => (
          <div key={item.texto}>
            <Item
              texto={item.texto}
              hecho={hechos.includes(item.texto)}
              onAlternar={() => alternar(item.texto)}
            />
            {item.hijos && (
              <div className="ml-6 border-l border-line pl-3">
                {item.hijos.map((h) => (
                  <Item
                    key={h}
                    texto={h}
                    hecho={hechos.includes(h)}
                    onAlternar={() => alternar(h)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Checklist que crea el usuario. Cada línea es un item; el estado se guarda
 * como prefijo "[x] " para que el texto y el tildado viajen juntos.
 */
function ChecklistLibre({
  valor,
  onCambio,
}: {
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  const lineas = Array.isArray(valor) ? valor : [];
  const items = lineas.map((l) => ({
    hecho: l.startsWith("[x] "),
    texto: l.replace(/^\[[ x]\] /, ""),
  }));

  const [nuevo, setNuevo] = useState("");
  const hechos = items.filter((i) => i.hecho).length;

  function serializar(xs: { hecho: boolean; texto: string }[]) {
    return xs
      .filter((i) => i.texto.trim())
      .map((i) => `${i.hecho ? "[x]" : "[ ]"} ${i.texto.trim()}`);
  }

  function alternar(i: number) {
    const copia = [...items];
    copia[i] = { ...copia[i], hecho: !copia[i].hecho };
    onCambio(serializar(copia));
  }

  function editar(i: number, texto: string) {
    const copia = [...items];
    copia[i] = { ...copia[i], texto };
    onCambio(serializar(copia));
  }

  function borrar(i: number) {
    onCambio(serializar(items.filter((_, j) => j !== i)));
  }

  function agregar() {
    const t = nuevo.trim();
    if (!t) return;
    onCambio(serializar([...items, { hecho: false, texto: t }]));
    setNuevo("");
  }

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-ok transition-all"
              style={{ width: `${(hechos / items.length) * 100}%` }}
            />
          </div>
          <span className="tnum shrink-0 text-xs text-text-3">
            {hechos}/{items.length}
          </span>
        </div>
      )}

      <div className="flex flex-col">
        {items.map((item, i) => (
          <div
            key={i}
            className="group/item flex items-center gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-surface-2"
          >
            <input
              type="checkbox"
              checked={item.hecho}
              onChange={() => alternar(i)}
              className="size-3.5 shrink-0 accent-ok"
            />
            <input
              defaultValue={item.texto}
              onBlur={(e) => {
                if (e.target.value.trim() !== item.texto) {
                  editar(i, e.target.value);
                }
              }}
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                item.hecho ? "text-text-3 line-through" : "text-text-2"
              }`}
            />
            <button
              type="button"
              aria-label="Quitar"
              onClick={() => borrar(i)}
              className="shrink-0 text-text-3 opacity-0 transition-opacity hover:text-critical focus:opacity-100 group-hover/item:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center gap-2.5 px-1">
        <Plus className="size-3.5 shrink-0 text-text-3" />
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          onBlur={agregar}
          placeholder="Agregar…"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm text-text outline-none placeholder:text-text-3"
        />
      </div>
    </div>
  );
}

function Texto({
  campo,
  valor,
  onCambio,
}: {
  campo: Campo;
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  return (
    <textarea
      defaultValue={typeof valor === "string" ? valor : ""}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if (v !== (typeof valor === "string" ? valor : "")) onCambio(v || null);
      }}
      rows={campo.filas ?? 2}
      placeholder="Escribí acá…"
      className="w-full rounded-lg border border-line bg-ground px-3 py-2 text-sm text-text outline-none transition-colors focus:border-line-strong"
    />
  );
}

function CampoRender({
  campo,
  valor,
  onCambio,
}: {
  campo: Campo;
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  return (
    <div>
      {campo.label && (
        <p className="mb-1.5 text-xs font-semibold text-text-2">{campo.label}</p>
      )}
      {campo.ayuda && (
        <p className="mb-1.5 text-[0.6875rem] text-text-3">{campo.ayuda}</p>
      )}
      {campo.tipo === "checklist-libre" ? (
        <ChecklistLibre valor={valor} onCambio={onCambio} />
      ) : campo.tipo === "checklist" ? (
        <Checklist campo={campo} valor={valor} onCambio={onCambio} />
      ) : campo.tipo === "opciones" ? (
        <Opciones campo={campo} valor={valor} onCambio={onCambio} />
      ) : (
        <Texto campo={campo} valor={valor} onCambio={onCambio} />
      )}
    </div>
  );
}

/** Formulario de la tarea. Cada campo se guarda por separado al cambiar. */
export function FormularioTarea({
  taskId,
  plantilla,
  pasos = [],
  contenido,
  columnas = 2,
}: {
  taskId: string;
  plantilla: Plantilla | null;
  /** Checklist que vino del SOP al crear el proyecto. */
  pasos?: ItemChecklist[];
  contenido: Contenido;
  columnas?: 1 | 2;
}) {
  const [valores, setValores] = useState<Contenido>(contenido);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  // El checklist del SOP va primero; después los campos de la plantilla.
  const secciones = [
    ...(pasos.length > 0
      ? [
          {
            id: "__sop__",
            titulo: "Checklist",
            campos: [
              {
                id: "pasos",
                label: "",
                tipo: "checklist" as const,
                items: pasos,
              },
            ],
          },
        ]
      : []),
    ...(plantilla?.secciones ?? []),
  ];

  function guardar(campoId: string, valor: ValorCampo) {
    setValores((v) => ({ ...v, [campoId]: valor }));
    setError(null);
    iniciar(async () => {
      try {
        await guardarCampoTarea(taskId, campoId, valor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end text-xs text-text-3">
        {pendiente ? "Guardando…" : error ? "" : "Guardado automático"}
      </div>

      {error && (
        <p className="rounded-lg bg-critical-dim px-3 py-2 text-sm text-critical">
          {error}
        </p>
      )}

      {secciones.map((s) => (
        <section key={s.id}>
          <h2 className="mb-4 border-b border-line pb-2 font-display text-base font-bold">
            {s.titulo}
          </h2>
          <div
            className={`grid gap-x-10 gap-y-5 ${columnas === 2 ? "md:grid-cols-2" : ""}`}
          >
            {s.campos.map((c) => (
              <div
                key={c.id}
                // Un checklist partido en dos columnas se lee mal.
                className={
                  c.tipo === "checklist" || c.tipo === "checklist-libre"
                    ? "md:col-span-2"
                    : ""
                }
              >
                <CampoRender
                  campo={c}
                  valor={valores[c.id] ?? null}
                  onCambio={(v) => guardar(c.id, v)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
