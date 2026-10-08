"use client";

import { useId, useState, type HTMLInputTypeAttribute, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { ChevronDown } from "@tailgrids/icons";
import { FieldDescription, FieldError, FieldLabel } from "@/components/tailgrids/core/field";
import { Input } from "@/components/tailgrids/core/input";
import {
  Select,
  SelectContent,
  SelectErrorMessage,
  SelectIndicator,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { TextArea } from "@/components/tailgrids/core/text-area";
import { TextField } from "@/components/tailgrids/core/text-field";
import { cn } from "@/utils/cn";

/*
 * Estos campos usan la validación nativa del navegador (required, min, step):
 * el servidor sigue siendo la fuente de verdad y vuelve a validar todo.
 */

interface CampoTextoProps {
  name: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  readOnly?: boolean;
  step?: string;
  min?: string;
  maxLength?: number;
  list?: string;
  placeholder?: string;
  description?: ReactNode;
  className?: string;
}

export function CampoTexto({
  name,
  label,
  type,
  defaultValue,
  value,
  onChange,
  required,
  readOnly,
  step,
  min,
  maxLength,
  list,
  placeholder,
  description,
  className,
}: CampoTextoProps) {
  return (
    <TextField
      name={name}
      type={type}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      className={cn("gap-1.5", className)}
    >
      <FieldLabel>{label}</FieldLabel>
      <Input
        step={step}
        min={min}
        maxLength={maxLength}
        list={list}
        placeholder={placeholder}
        className="w-full"
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError />
    </TextField>
  );
}

interface CampoAreaProps {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
}

export function CampoArea({ name, label, defaultValue, rows = 3 }: CampoAreaProps) {
  return (
    <TextField name={name} defaultValue={defaultValue} className="gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <TextArea rows={rows} className="py-2.5" />
    </TextField>
  );
}

export interface OpcionCampo {
  value: string;
  label: string;
}

interface CampoSelectProps {
  name: string;
  label: string;
  options: OpcionCampo[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  /** Agrega la opción "Sin especificar", que envía el campo vacío. */
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
}

const SIN_VALOR = "__sin_valor__";

/** Select del template que viaja en el FormData como un `<select>` común. */
export function CampoSelect({
  name,
  label,
  options,
  value,
  defaultValue = "",
  onChange,
  required,
  allowEmpty,
  placeholder = "Seleccionar",
  className,
}: CampoSelectProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  // `null` deja al Select controlado y sin selección (el tipo del template no lo declara).
  const selectedKey = (current === "" ? null : current) as unknown as Key;

  return (
    <Select
      name={name}
      value={selectedKey}
      onChange={(key: Key | null) => {
        const next = key === null || key === SIN_VALOR ? "" : String(key);
        setInner(next);
        onChange?.(next);
      }}
      isRequired={required}
      placeholder={placeholder}
      className={className}
    >
      <SelectLabel>{label}</SelectLabel>
      <SelectTrigger size="lg">
        <SelectValue />
        <SelectIndicator />
      </SelectTrigger>
      <SelectErrorMessage />
      <SelectContent>
        {allowEmpty && (
          <SelectItem id={SIN_VALOR} textValue="Sin especificar">
            Sin especificar
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.value} id={option.value} textValue={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface CampoCheckboxProps {
  name: string;
  label: string;
  defaultSelected?: boolean;
}

export function CampoCheckbox({ name, label, defaultSelected }: CampoCheckboxProps) {
  return (
    <Checkbox name={name} defaultSelected={defaultSelected} size="md" className="py-2">
      <span className="text-sm font-medium text-input-label-text">{label}</span>
    </Checkbox>
  );
}

/** Texto de ayuda debajo de un grupo de campos. */
export function Nota({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs leading-relaxed text-text-tertiary", className)}>{children}</p>;
}

/** Recuadro destacado para el bloque de cotización ARS. */
export function Recuadro({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-card-border bg-background-gray-secondary p-4">
      {children}
    </div>
  );
}

/**
 * Sección plegable. El contenido queda siempre montado (solo se oculta), así
 * sus campos viajan en el FormData aunque estén cerrados.
 */
export function Plegable({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="rounded-xl border border-card-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {titulo}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <div id={panelId} hidden={!open} className="flex flex-col gap-4 px-4 pb-4">
        {children}
      </div>
    </div>
  );
}
