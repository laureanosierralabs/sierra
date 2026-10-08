"use client";

import { ChecklistProgreso } from "@/components/landing/checklist-progreso";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { cn } from "@/utils/cn";
import type { Campo, ItemChecklist, ValorCampo } from "@/lib/landing/plantillas";

function ItemTildable({
  texto,
  hecho,
  onAlternar,
}: {
  texto: string;
  hecho: boolean;
  onAlternar: () => void;
}) {
  return (
    <Checkbox
      isSelected={hecho}
      onChange={onAlternar}
      className="w-full items-start gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-background-gray-secondary [&>div]:mt-0.5"
    >
      <span className={cn("text-sm", hecho ? "text-text-tertiary line-through" : "text-text-secondary")}>
        {texto}
      </span>
    </Checkbox>
  );
}

/** Checklist fijo: viene del SOP o de la plantilla, solo se tilda. */
export function CampoChecklist({
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
      <ChecklistProgreso hechos={hechos.length} total={total} />

      <div className="flex flex-col">
        {items.map((item) => (
          <div key={item.texto}>
            <ItemTildable
              texto={item.texto}
              hecho={hechos.includes(item.texto)}
              onAlternar={() => alternar(item.texto)}
            />
            {item.hijos && (
              <div className="ml-6 border-l border-card-border pl-3">
                {item.hijos.map((h) => (
                  <ItemTildable
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
