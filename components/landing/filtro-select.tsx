"use client";

import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";

/** Select de filtro controlado: la primera opción (`todos`) quita el filtro. */
export function FiltroSelect({
  etiqueta,
  valor,
  onChange,
  todos,
  opciones,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  /** Valor y texto de la opción "sin filtro". */
  todos: { valor: string; etiqueta: string };
  opciones: { valor: string; etiqueta: string }[];
}) {
  return (
    <Select
      aria-label={etiqueta}
      value={valor}
      onChange={(key) => onChange(String(key))}
      className="w-full sm:w-52"
    >
      <SelectTrigger size="md">
        <SelectValue />
        <SelectIndicator />
      </SelectTrigger>
      <SelectContent>
        <SelectItem id={todos.valor} textValue={todos.etiqueta}>
          {todos.etiqueta}
        </SelectItem>
        {opciones.map((o) => (
          <SelectItem key={o.valor} id={o.valor} textValue={o.etiqueta}>
            {o.etiqueta}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
