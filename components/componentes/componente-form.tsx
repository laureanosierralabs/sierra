"use client";

import { Pencil1 } from "@tailgrids/icons";
import { guardarComponente } from "@/app/landing-pages/componentes-acciones";
import { Campo, DialogoForm, Input, Select, Textarea } from "@/components/landing/dialogo-form";
import {
  CATEGORIAS,
  LENGUAJES,
  LABEL_LENGUAJE,
  MAX_CODIGO,
  MAX_COMANDO,
  MAX_DESCRIPCION,
  MAX_PROMPT,
  MAX_TITULO,
  MAX_URL,
  type ComponenteUI,
} from "@/lib/componentes/tipos";

/** Alta o edición de un componente. Sin `componente` es alta. */
export function ComponenteForm({ componente }: { componente?: ComponenteUI }) {
  return (
    <DialogoForm
      titulo={componente ? "Editar componente" : "Nuevo componente"}
      etiquetaAbrir={componente ? "Editar componente" : "Agregar componente"}
      action={guardarComponente}
      disparador={componente ? <Pencil1 /> : undefined}
      ancho="2xl"
    >
      {componente && <input type="hidden" name="id" value={componente.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Título *">
          <Input name="title" required maxLength={MAX_TITULO} defaultValue={componente?.title ?? ""} placeholder="Hero con video de fondo" />
        </Campo>
        <Campo label="Categoría *">
          <Select name="category" required defaultValue={componente?.category ?? ""}>
            <option value="" disabled>
              Elegí una categoría
            </option>
            {CATEGORIAS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="Descripción">
        <Textarea name="description" rows={2} maxLength={MAX_DESCRIPCION} defaultValue={componente?.description ?? ""} placeholder="Para qué sirve y cuándo conviene usarlo." />
      </Campo>

      <Campo label="Tags (separados por coma)">
        <Input name="tags" defaultValue={componente?.tags.join(", ") ?? ""} placeholder="oscuro, animado, shadcn" />
      </Campo>

      <Campo label="Comando de instalación">
        <Input
          name="install_command"
          maxLength={MAX_COMANDO}
          defaultValue={componente?.install_command ?? ""}
          placeholder="npx shadcn@latest add …"
        />
      </Campo>

      <Campo label="Lenguaje del código">
        <Select name="code_language" defaultValue={componente?.code_language ?? "tsx"}>
          {LENGUAJES.map((l) => (
            <option key={l} value={l}>
              {LABEL_LENGUAJE[l]}
            </option>
          ))}
        </Select>
      </Campo>
      <div className="[&_textarea]:font-mono [&_textarea]:text-sm">
        <Campo label="Código">
          <Textarea
            name="code"
            rows={10}
            maxLength={MAX_CODIGO}
            spellCheck={false}
            defaultValue={componente?.code ?? ""}
            placeholder="Pegá el componente. Si el lenguaje es HTML se muestra como vista previa aislada."
          />
        </Campo>
      </div>

      <Campo label="Prompt">
        <Textarea
          name="prompt"
          rows={4}
          maxLength={MAX_PROMPT}
          defaultValue={componente?.prompt ?? ""}
          placeholder="El prompt para pedirle a una IA que lo arme en una landing."
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Link de referencia">
          <Input name="reference_url" type="url" maxLength={MAX_URL} defaultValue={componente?.reference_url ?? ""} placeholder="https://…" />
        </Campo>
        <Campo label="Link de vista previa (imagen o video)">
          <Input name="preview_url" type="url" maxLength={MAX_URL} defaultValue={componente?.preview_url ?? ""} placeholder="https://…/captura.png" />
        </Campo>
      </div>
    </DialogoForm>
  );
}
