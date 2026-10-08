"use client";

import type { HTMLInputTypeAttribute } from "react";
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

interface BaseFieldProps {
  name: string;
  label: string;
  /** Mensaje de error del campo (`form.errors[name]`). */
  error?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  /** Se dispara al editar; `form.fieldProps(name)` lo usa para limpiar el error. */
  onChange?: () => void;
  className?: string;
}

interface FormTextFieldProps extends BaseFieldProps {
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
}

/*
 * `validationBehavior="aria"`: sin esto React Aria usa la validación nativa del
 * navegador (burbuja) y el submit nunca llega a Zod, que es quien da el mensaje.
 */

export function FormTextField({
  name,
  label,
  error,
  description,
  required,
  disabled,
  onChange,
  className,
  type,
  placeholder,
  defaultValue,
  autoComplete,
}: FormTextFieldProps) {
  return (
    <TextField
      name={name}
      type={type}
      defaultValue={defaultValue}
      autoComplete={autoComplete}
      required={required}
      disabled={disabled}
      invalid={Boolean(error)}
      validationBehavior="aria"
      onChange={onChange}
      className={className ?? "gap-1.5"}
    >
      <FieldLabel>{label}</FieldLabel>
      <Input placeholder={placeholder} />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </TextField>
  );
}

interface FormTextAreaFieldProps extends BaseFieldProps {
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}

export function FormTextAreaField({
  name,
  label,
  error,
  description,
  required,
  disabled,
  onChange,
  className,
  placeholder,
  defaultValue,
  rows,
}: FormTextAreaFieldProps) {
  return (
    <TextField
      name={name}
      defaultValue={defaultValue}
      required={required}
      disabled={disabled}
      invalid={Boolean(error)}
      validationBehavior="aria"
      onChange={onChange}
      className={className ?? "gap-1.5"}
    >
      <FieldLabel>{label}</FieldLabel>
      <TextArea placeholder={placeholder} rows={rows} />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </TextField>
  );
}

export interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectFieldProps extends BaseFieldProps {
  options: FormSelectOption[];
  placeholder?: string;
  defaultValue?: string;
}

/**
 * Select del template. Con `name`, React Aria renderiza un `<select>` oculto,
 * así que el valor viaja en el `FormData` como cualquier input.
 */
export function FormSelectField({
  name,
  label,
  error,
  required,
  disabled,
  onChange,
  className,
  options,
  placeholder,
  defaultValue,
}: FormSelectFieldProps) {
  return (
    <Select
      name={name}
      defaultValue={defaultValue}
      isRequired={required}
      isDisabled={disabled}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      placeholder={placeholder}
      onChange={onChange}
      className={className}
    >
      <SelectLabel>{label}</SelectLabel>
      <SelectTrigger size="lg">
        <SelectValue />
        <SelectIndicator />
      </SelectTrigger>
      <SelectErrorMessage>{error}</SelectErrorMessage>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} id={option.value} textValue={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
