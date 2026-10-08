"use client";

import { useState } from "react";
import { Close, Plus } from "@tailgrids/icons";
import { ChecklistProgreso } from "@/components/landing/checklist-progreso";
import { Button } from "@/components/tailgrids/core/button";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { Input } from "@/components/tailgrids/core/input";
import { cn } from "@/utils/cn";
import type { ValorCampo } from "@/lib/landing/plantillas";

interface ItemLibre {
  hecho: boolean;
  texto: string;
}

/** El estado se guarda como prefijo "[x] " para que el texto y el tildado viajen juntos. */
function serializar(items: ItemLibre[]): string[] {
  return items
    .filter((i) => i.texto.trim())
    .map((i) => `${i.hecho ? "[x]" : "[ ]"} ${i.texto.trim()}`);
}

/**
 * Checklist que crea el usuario. Cada línea es un item; el estado se guarda
 * como prefijo "[x] " para que el texto y el tildado viajen juntos.
 */
export function CampoChecklistLibre({
  valor,
  onCambio,
}: {
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  const lineas = Array.isArray(valor) ? valor : [];
  const items: ItemLibre[] = lineas.map((l) => ({
    hecho: l.startsWith("[x] "),
    texto: l.replace(/^\[[ x]\] /, ""),
  }));

  const [nuevo, setNuevo] = useState("");
  const hechos = items.filter((i) => i.hecho).length;

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
      {items.length > 0 && <ChecklistProgreso hechos={hechos} total={items.length} />}

      <div className="flex flex-col">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-background-gray-secondary"
          >
            <Checkbox
              aria-label="Marcar como hecho"
              isSelected={item.hecho}
              onChange={() => alternar(i)}
            />
            <Input
              aria-label="Texto del item"
              defaultValue={item.texto}
              onBlur={(e) => {
                if (e.target.value.trim() !== item.texto) {
                  editar(i, e.target.value);
                }
              }}
              className={cn(
                "min-w-0 flex-1 border-transparent bg-transparent px-2 py-1 text-sm",
                item.hecho ? "text-text-tertiary line-through" : "text-text-secondary",
              )}
            />
            <Button
              appearance="ghost"
              size="xs"
              iconOnly
              aria-label="Quitar"
              onPress={() => borrar(i)}
            >
              <Close />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center gap-2.5 px-1">
        <Plus className="size-4 shrink-0 text-text-tertiary" />
        <Input
          aria-label="Agregar item"
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
          className="min-w-0 flex-1 border-transparent bg-transparent px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}
