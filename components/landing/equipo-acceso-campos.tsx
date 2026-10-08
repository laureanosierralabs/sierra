"use client";

import { useState } from "react";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { DEFINICIONES, UNIDADES, type Unidad } from "@/lib/unidades";
import type { Rol } from "@/lib/landing/auth";

const ROLES: { value: Rol; label: string }[] = [
  { value: "member", label: "Builder" },
  { value: "owner", label: "Owner" },
];

/**
 * Rol + unidades. Los checkboxes se ocultan si el rol elegido es owner: ve
 * todo, así que no manda `units`. El rol es controlado porque decide qué se
 * muestra; el valor igual viaja en el FormData por el `name` del Select.
 */
export function AccesoCampos({
  marcadas,
  rol,
  errorUnidades,
  onCambioUnidades,
}: {
  marcadas: Unidad[];
  rol: Rol;
  /** Mensaje de `form.errors.units`. */
  errorUnidades?: string;
  /** Limpia el error al editar (`form.clearError("units")`). */
  onCambioUnidades: () => void;
}) {
  const [actual, setActual] = useState<Rol>(rol);

  return (
    <>
      <Select
        name="role"
        value={actual}
        onChange={(key) => {
          setActual(String(key) as Rol);
          onCambioUnidades();
        }}
      >
        <SelectLabel>Rol</SelectLabel>
        <SelectTrigger size="lg">
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.value} id={r.value} textValue={r.label}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {actual === "owner" ? (
        <p className="rounded-lg bg-background-gray-secondary px-3 py-2 text-xs text-text-secondary">
          Un owner ve todas las unidades y puede gestionar el equipo.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium text-input-label-text">
            Unidades a las que accede
          </legend>
          {UNIDADES.map((u) => (
            <Checkbox
              key={u}
              name="units"
              value={u}
              defaultSelected={marcadas.includes(u)}
              onChange={onCambioUnidades}
              className="text-sm text-text-secondary"
            >
              {DEFINICIONES[u].nombre}
            </Checkbox>
          ))}
          {errorUnidades && (
            <p role="alert" className="text-sm text-error-500">
              {errorUnidades}
            </p>
          )}
        </fieldset>
      )}
    </>
  );
}
