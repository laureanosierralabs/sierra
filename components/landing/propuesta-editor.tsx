"use client";

import { useState } from "react";
import { Pencil1, Plus } from "@tailgrids/icons";
import { DialogoForm, Input, Textarea } from "@/components/landing/dialogo-form";
import { Button } from "@/components/tailgrids/core/button";
import { guardarPropuesta } from "@/app/landing-pages/acciones";
import { MAX_INCLUYE, MAX_PREGUNTAS, type ElementoBiblioteca, type PreguntaPropuesta } from "@/lib/landing/propuesta";
import { MAX_PASOS, PASOS, TIPOS_PASO, type PasoEmbudo, type TipoPaso } from "@/lib/landing/embudo";
import { DiagramaEmbudo } from "@/components/landing/diagrama-embudo";

const DISPARADOR =
  "inline-flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:underline [&>svg]:size-3.5";

const mismo = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/* ───────────── Este servicio incluye ───────────── */

function CamposIncluye({
  quoteId,
  valores,
  biblioteca,
}: {
  quoteId: string;
  valores: string[];
  biblioteca: ElementoBiblioteca[];
}) {
  // Lo de la biblioteca se tilda; lo que no está en ella es propio de esta cotización.
  const [elegidos, setElegidos] = useState(() => new Set(biblioteca.filter((b) => valores.some((v) => mismo(v, b.title))).map((b) => b.id)));
  const [propios, setPropios] = useState(() =>
    valores.filter((v) => !biblioteca.some((b) => mismo(v, b.title))).map((texto) => ({ texto, guardar: false })),
  );
  const [nuevo, setNuevo] = useState("");

  const final = [...biblioteca.filter((b) => elegidos.has(b.id)).map((b) => b.title), ...propios.map((p) => p.texto)];
  const alternar = (id: string) =>
    setElegidos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const agregar = () => {
    const t = nuevo.trim();
    if (!t || final.some((v) => mismo(v, t))) return setNuevo("");
    setPropios((p) => [...p, { texto: t, guardar: true }]);
    setNuevo("");
  };

  return (
    <>
      <input type="hidden" name="quote_id" value={quoteId} />
      <input type="hidden" name="seccion" value="incluye" />
      <input type="hidden" name="valores" value={JSON.stringify(final)} />
      <input type="hidden" name="a_biblioteca" value={JSON.stringify(propios.filter((p) => p.guardar).map((p) => p.texto))} />

      {biblioteca.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-2 text-sm font-medium text-input-label-text">De tu biblioteca</legend>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-card-border">
            {biblioteca.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-start gap-2.5 border-b border-card-border px-3 py-2 text-sm last:border-b-0 hover:bg-background-gray-secondary">
                <input type="checkbox" checked={elegidos.has(b.id)} onChange={() => alternar(b.id)} className="mt-0.5" />
                <span className="text-text-primary">{b.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-input-label-text">Propios de esta cotización</legend>
        {propios.map((p, i) => (
          <div key={p.texto} className="flex items-start justify-between gap-3 rounded-lg border border-card-border px-3 py-2 text-sm">
            <span className="min-w-0">
              <span className="block text-text-primary">{p.texto}</span>
              <label className="mt-1 flex items-center gap-1.5 text-xs text-text-tertiary">
                <input
                  type="checkbox"
                  checked={p.guardar}
                  onChange={() => setPropios((l) => l.map((x, j) => (j === i ? { ...x, guardar: !x.guardar } : x)))}
                />
                Guardar en la biblioteca para próximas cotizaciones
              </label>
            </span>
            <button type="button" onClick={() => setPropios((l) => l.filter((_, j) => j !== i))} className="shrink-0 text-xs text-text-tertiary hover:text-badge-error-text">
              Quitar
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregar();
              }
            }}
            maxLength={300}
            placeholder="Ej.: Integración con MailerLite"
            aria-label="Agregar algo que incluye el servicio"
          />
          <Button type="button" appearance="outline" onPress={agregar} isDisabled={!nuevo.trim() || final.length >= MAX_INCLUYE}>
            <Plus />
            Sumar
          </Button>
        </div>
      </fieldset>
      <p className="text-xs text-text-tertiary">
        {final.length} de {MAX_INCLUYE} posibles. Salen en el documento en este orden: primero los de la biblioteca, después los propios.
      </p>
    </>
  );
}

export function EditorIncluye(props: { quoteId: string; valores: string[]; biblioteca: ElementoBiblioteca[] }) {
  return (
    <DialogoForm
      titulo="Este servicio incluye"
      action={guardarPropuesta}
      ancho="2xl"
      disparador={
        <span className={DISPARADOR}>
          <Pencil1 />
          Editar
        </span>
      }
    >
      <CamposIncluye {...props} />
    </DialogoForm>
  );
}

/* ───────────── Importantes ───────────── */

function CamposPreguntas({
  quoteId,
  valores,
  biblioteca,
}: {
  quoteId: string;
  valores: PreguntaPropuesta[];
  biblioteca: ElementoBiblioteca[];
}) {
  // Cada pregunta de la biblioteca se puede tildar y ajustar su respuesta para esta cotización.
  const [elegidas, setElegidas] = useState(() => {
    const m = new Map<string, string>();
    for (const b of biblioteca) {
      const actual = valores.find((v) => mismo(v.q, b.title));
      if (actual) m.set(b.id, actual.a);
    }
    return m;
  });
  const [propias, setPropias] = useState(() =>
    valores.filter((v) => !biblioteca.some((b) => mismo(v.q, b.title))).map((v) => ({ ...v, guardar: false })),
  );

  const final: PreguntaPropuesta[] = [
    ...biblioteca.filter((b) => elegidas.has(b.id)).map((b) => ({ q: b.title, a: elegidas.get(b.id) ?? "" })),
    ...propias.map(({ q, a }) => ({ q, a })),
  ];
  const alternar = (b: ElementoBiblioteca) =>
    setElegidas((m) => {
      const n = new Map(m);
      if (n.has(b.id)) n.delete(b.id);
      else n.set(b.id, b.body ?? "");
      return n;
    });

  return (
    <>
      <input type="hidden" name="quote_id" value={quoteId} />
      <input type="hidden" name="seccion" value="pregunta" />
      <input type="hidden" name="valores" value={JSON.stringify(final)} />
      <input
        type="hidden"
        name="a_biblioteca"
        value={JSON.stringify(propias.filter((p) => p.guardar).map(({ q, a }) => ({ q, a })))}
      />

      {biblioteca.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-input-label-text">De tu biblioteca</legend>
          {biblioteca.map((b) => {
            const activa = elegidas.has(b.id);
            return (
              <div key={b.id} className="rounded-lg border border-card-border px-3 py-2">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input type="checkbox" checked={activa} onChange={() => alternar(b)} className="mt-0.5" />
                  <span className="font-medium text-text-primary">{b.title}</span>
                </label>
                {activa && (
                  <>
                    <Textarea
                      rows={3}
                      maxLength={2000}
                      value={elegidas.get(b.id) ?? ""}
                      onChange={(e) => setElegidas((m) => new Map(m).set(b.id, e.target.value))}
                      aria-label={`Respuesta a: ${b.title}`}
                    />
                    {!(elegidas.get(b.id) ?? "").trim() && (
                      <p className="mt-1 text-xs text-badge-warning-text">Sin respuesta no se guarda.</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
          <p className="text-xs text-text-tertiary">
            Si ajustás una respuesta, cambia solo en esta cotización. Varias líneas salen como lista.
          </p>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-input-label-text">Propias de esta cotización</legend>
        {propias.map((p, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-card-border px-3 py-2">
            <Input
              value={p.q}
              maxLength={300}
              onChange={(e) => setPropias((l) => l.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
              placeholder="¿Cuándo me entregarán el proyecto?"
              aria-label="Pregunta"
            />
            <Textarea
              rows={3}
              maxLength={2000}
              value={p.a}
              onChange={(e) => setPropias((l) => l.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
              placeholder="Si concretamos esta semana, te entregamos la página el…"
              aria-label="Respuesta"
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <input
                  type="checkbox"
                  checked={p.guardar}
                  onChange={() => setPropias((l) => l.map((x, j) => (j === i ? { ...x, guardar: !x.guardar } : x)))}
                />
                Guardar en la biblioteca
              </label>
              <button type="button" onClick={() => setPropias((l) => l.filter((_, j) => j !== i))} className="text-xs text-text-tertiary hover:text-badge-error-text">
                Quitar
              </button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          appearance="outline"
          className="self-start"
          isDisabled={final.length >= MAX_PREGUNTAS}
          onPress={() => setPropias((l) => [...l, { q: "", a: "", guardar: false }])}
        >
          <Plus />
          Sumar una pregunta
        </Button>
      </fieldset>
    </>
  );
}

export function EditorPreguntas(props: { quoteId: string; valores: PreguntaPropuesta[]; biblioteca: ElementoBiblioteca[] }) {
  return (
    <DialogoForm
      titulo="Importantes"
      action={guardarPropuesta}
      ancho="2xl"
      disparador={
        <span className={DISPARADOR}>
          <Pencil1 />
          Editar
        </span>
      }
    >
      <CamposPreguntas {...props} />
    </DialogoForm>
  );
}

/* ───────────── Diagrama del embudo ───────────── */

const GRUPOS_PASO: { titulo: string; categoria: "pagina" | "integracion" | "separador" }[] = [
  { titulo: "Páginas", categoria: "pagina" },
  { titulo: "Integraciones", categoria: "integracion" },
  { titulo: "Otros", categoria: "separador" },
];

function CamposEmbudo({
  quoteId,
  valores,
  sugeridos,
}: {
  quoteId: string;
  valores: PasoEmbudo[];
  sugeridos: PasoEmbudo[];
}) {
  const [pasos, setPasos] = useState<PasoEmbudo[]>(valores);
  const [nuevo, setNuevo] = useState<TipoPaso>("registro");

  const mover = (i: number, d: -1 | 1) =>
    setPasos((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <>
      <input type="hidden" name="quote_id" value={quoteId} />
      <input type="hidden" name="seccion" value="embudo" />
      <input type="hidden" name="valores" value={JSON.stringify(pasos)} />

      <div className="rounded-lg border border-card-border bg-white p-4 text-[#0b1029]">
        {pasos.length === 0 ? (
          <p className="text-center text-sm text-text-tertiary">Sin pasos: armalo desde los ítems o agregá uno abajo.</p>
        ) : (
          <DiagramaEmbudo pasos={pasos} />
        )}
      </div>

      {sugeridos.length > 0 && (
        <Button type="button" appearance="outline" className="self-start" onPress={() => setPasos(sugeridos)}>
          Armar desde los ítems
        </Button>
      )}

      <ol className="flex flex-col gap-1.5">
        {pasos.map((p, i) => (
          <li key={`${p.tipo}-${i}`} className="flex items-center gap-2 rounded-lg border border-card-border px-2 py-1.5 text-sm">
            <span className="w-5 text-center text-xs text-text-tertiary tabular-nums">{i + 1}</span>
            {p.tipo === "separador" ? (
              <span className="flex-1 text-text-tertiary">— Separador entre flujos —</span>
            ) : (
              <Input
                value={p.etiqueta ?? ""}
                placeholder={PASOS[p.tipo].etiqueta}
                maxLength={40}
                onChange={(e) => setPasos((l) => l.map((x, j) => (j === i ? { ...x, etiqueta: e.target.value } : x)))}
                aria-label={`Nombre del paso ${i + 1}`}
              />
            )}
            <span className="flex shrink-0 gap-1">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="rounded px-1.5 text-text-tertiary hover:text-text-primary disabled:opacity-30" aria-label="Subir">
                ↑
              </button>
              <button type="button" onClick={() => mover(i, 1)} disabled={i === pasos.length - 1} className="rounded px-1.5 text-text-tertiary hover:text-text-primary disabled:opacity-30" aria-label="Bajar">
                ↓
              </button>
              <button type="button" onClick={() => setPasos((l) => l.filter((_, j) => j !== i))} className="rounded px-1.5 text-text-tertiary hover:text-badge-error-text" aria-label="Quitar">
                ✕
              </button>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex gap-2">
        <select
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value as TipoPaso)}
          aria-label="Paso para agregar"
          className="w-full rounded-lg border border-card-border bg-input-background px-4 py-2.5 text-title-50 outline-none"
        >
          {GRUPOS_PASO.map((g) => (
            <optgroup key={g.categoria} label={g.titulo}>
              {TIPOS_PASO.filter((t) => PASOS[t].categoria === g.categoria).map((t) => (
                <option key={t} value={t}>
                  {PASOS[t].etiqueta}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Button
          type="button"
          appearance="outline"
          isDisabled={pasos.length >= MAX_PASOS}
          onPress={() => setPasos((l) => [...l, { tipo: nuevo }])}
        >
          <Plus />
          Agregar
        </Button>
      </div>
      <p className="text-xs text-text-tertiary">
        Hasta {MAX_PASOS} pasos. En el link del cliente el recorrido se anima; en el PDF sale quieto.
      </p>
    </>
  );
}

export function EditorEmbudo(props: { quoteId: string; valores: PasoEmbudo[]; sugeridos: PasoEmbudo[] }) {
  return (
    <DialogoForm
      titulo="Diagrama del embudo"
      action={guardarPropuesta}
      ancho="2xl"
      disparador={
        <span className={DISPARADOR}>
          <Pencil1 />
          Editar
        </span>
      }
    >
      <CamposEmbudo {...props} />
    </DialogoForm>
  );
}
