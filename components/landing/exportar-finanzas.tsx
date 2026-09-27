"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download } from "lucide-react";

const RUTA = "/landing-pages/finanzas/exportar";

const OPCIONES = [
  { formato: "csv", label: "CSV", detalle: "Excel / Sheets" },
  { formato: "json", label: "JSON", detalle: "Análisis externo" },
  { formato: "md", label: "Informe para IA", detalle: "Markdown" },
];

export function ExportarFinanzas() {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  // El aviso de copiado se apaga solo: un estado que queda pegado miente.
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2200);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiarParaIA() {
    setCopiando(true);
    try {
      const r = await fetch(`${RUTA}?formato=md`);
      if (!r.ok) throw new Error("No se pudo generar el informe");
      await navigator.clipboard.writeText(await r.text());
      setCopiado(true);
      setAbierto(false);
    } catch {
      alert("No se pudo copiar el informe.");
    } finally {
      setCopiando(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        {copiado && (
          <span className="flex items-center gap-1.5 text-xs text-ok">
            <Check className="size-3.5" />
            Contexto financiero copiado
          </span>
        )}

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-text transition-colors hover:border-line-strong hover:bg-surface"
        >
          <Download className="size-3.5" />
          Exportar
          <ChevronDown className="size-3.5 text-text-3" />
        </button>
      </div>

      {abierto && (
        <div className="absolute right-0 z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-e3">
          <button
            type="button"
            onClick={copiarParaIA}
            disabled={copiando}
            className="flex w-full items-start gap-2.5 border-b border-line px-3.5 py-2.5 text-left transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            <Copy className="mt-0.5 size-3.5 shrink-0 text-text-3" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                {copiando ? "Generando…" : "Copiar para IA"}
              </span>
              <span className="block text-xs text-text-3">
                Al portapapeles, listo para pegar
              </span>
            </span>
          </button>

          {OPCIONES.map((o) => (
            <a
              key={o.formato}
              href={`${RUTA}?formato=${o.formato}`}
              onClick={() => setAbierto(false)}
              className="flex items-start gap-2.5 border-b border-line px-3.5 py-2.5 transition-colors last:border-0 hover:bg-surface-2"
            >
              <Download className="mt-0.5 size-3.5 shrink-0 text-text-3" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-xs text-text-3">{o.detalle}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
