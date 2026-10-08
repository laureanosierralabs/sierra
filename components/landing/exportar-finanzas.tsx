"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Copy1, Download1 } from "@tailgrids/icons";
import { buttonStyles } from "@/components/tailgrids/core/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";

const RUTA = "/landing-pages/finanzas/exportar";

const OPCIONES = [
  { formato: "csv", label: "CSV", detalle: "Excel / Sheets" },
  { formato: "json", label: "JSON", detalle: "Análisis externo" },
  { formato: "md", label: "Informe para IA", detalle: "Markdown" },
];

export function ExportarFinanzas() {
  const [copiando, setCopiando] = useState(false);

  async function copiarParaIA() {
    setCopiando(true);
    try {
      const r = await fetch(`${RUTA}?formato=md`);
      if (!r.ok) throw new Error("No se pudo generar el informe");
      await navigator.clipboard.writeText(await r.text());
      toast.success("Contexto financiero copiado");
    } catch {
      toast.error("No se pudo copiar el informe.");
    } finally {
      setCopiando(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Exportar finanzas"
        className={buttonStyles({ appearance: "outline", size: "md", className: "gap-2" })}
      >
        <Download1 />
        Exportar
        <ChevronDown />
      </DropdownMenuTrigger>

      <DropdownMenuContent placement="bottom end" className="w-64 p-1">
        <DropdownMenuItem
          id="copiar"
          textValue="Copiar para IA"
          isDisabled={copiando}
          onAction={copiarParaIA}
          className="items-start gap-2.5 px-2.5 py-2"
        >
          <Copy1 className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-text-primary">
              {copiando ? "Generando…" : "Copiar para IA"}
            </span>
            <span className="block text-xs text-text-tertiary">
              Al portapapeles, listo para pegar
            </span>
          </span>
        </DropdownMenuItem>

        {OPCIONES.map((o) => (
          <DropdownMenuItem
            key={o.formato}
            id={o.formato}
            textValue={o.label}
            href={`${RUTA}?formato=${o.formato}`}
            className="items-start gap-2.5 px-2.5 py-2"
          >
            <Download1 className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-text-primary">{o.label}</span>
              <span className="block text-xs text-text-tertiary">{o.detalle}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
