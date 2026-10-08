"use client";

import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import type { ZodFormApi } from "@/components/landing/dialogo-form";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { SelectorMiembros } from "@/components/landing/selector-miembros";
import {
  ESTADOS_PROYECTO,
  ETAPAS,
  LABEL_ESTADO_PROYECTO,
  LABEL_ETAPA,
  LABEL_PRIORIDAD,
  LABEL_TIPO_PAGINA,
  PRIORIDADES,
  TIPOS_PAGINA,
  type Cliente,
  type Miembro,
  type Proceso,
  type Proyecto,
} from "@/lib/landing/tipos";

/** Valores precargados al crear un proyecto desde una cotización aprobada. */
export interface DesdeCotizacion {
  quoteId: string;
  clientId: string | null;
  nombre: string;
}

const OPCIONES_ESTADO = ESTADOS_PROYECTO.map((e) => ({
  value: e,
  label: LABEL_ESTADO_PROYECTO[e],
}));

const OPCIONES_PRIORIDAD = PRIORIDADES.map((p) => ({ value: p, label: LABEL_PRIORIDAD[p] }));

const OPCIONES_ETAPA = [
  { value: SIN_OPCION, label: "Sin etapa" },
  ...ETAPAS.map((e) => ({ value: e, label: LABEL_ETAPA[e] })),
];

const OPCIONES_TIPO = [
  { value: SIN_OPCION, label: "Sin definir" },
  ...TIPOS_PAGINA.map((t) => ({ value: t, label: LABEL_TIPO_PAGINA[t] })),
];

export function ProyectoCampos({
  form,
  miembros,
  clientes,
  procesos,
  proyecto,
  desdeCotizacion,
}: {
  form: ZodFormApi;
  miembros: Miembro[];
  clientes: Pick<Cliente, "id" | "name">[];
  procesos: Pick<Proceso, "id" | "slug" | "name">[];
  proyecto?: Proyecto;
  desdeCotizacion?: DesdeCotizacion;
}) {
  const editar = Boolean(proyecto);

  const opcionesCliente = [
    {
      value: SIN_OPCION,
      label: proyecto?.client_name ? `Sin vincular (${proyecto.client_name})` : "Sin cliente",
    },
    ...clientes.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <>
      {proyecto && <input type="hidden" name="id" value={proyecto.id} />}
      {desdeCotizacion && <input type="hidden" name="quote_id" value={desdeCotizacion.quoteId} />}
      {proyecto?.quote_id && !desdeCotizacion && (
        <input type="hidden" name="quote_id" value={proyecto.quote_id} />
      )}
      {/* client_name se conserva para no perder el dato de proyectos viejos */}
      {proyecto?.client_name && (
        <input type="hidden" name="client_name" value={proyecto.client_name} />
      )}

      <FormTextField
        {...form.fieldProps("name")}
        label="Proyecto"
        required
        defaultValue={proyecto?.name ?? desdeCotizacion?.nombre ?? ""}
      />

      <FormSelectField
        {...form.fieldProps("client_id")}
        label="Cliente"
        options={opcionesCliente}
        defaultValue={proyecto?.client_id ?? desdeCotizacion?.clientId ?? SIN_OPCION}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          {...form.fieldProps("status")}
          label="Estado"
          options={OPCIONES_ESTADO}
          defaultValue={proyecto?.status ?? "por-iniciar"}
        />
        <FormSelectField
          {...form.fieldProps("priority")}
          label="Prioridad"
          options={OPCIONES_PRIORIDAD}
          defaultValue={proyecto?.priority ?? "media"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-input-label-text">Responsables</span>
        <SelectorMiembros miembros={miembros} defaultValue={proyecto?.assignee_ids} />
      </div>

      {/* Las dos fechas definen la barra del proyecto en el calendario. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextField
          {...form.fieldProps("start_date")}
          type="date"
          label="Inicio"
          required={!editar}
          defaultValue={proyecto?.start_date ?? ""}
        />
        <FormTextField
          {...form.fieldProps("due_date")}
          type="date"
          label="Entrega"
          defaultValue={proyecto?.due_date ?? ""}
        />
      </div>

      {/* Solo al crear: cambiarlo después no recrearía las tareas ya hechas. */}
      {!editar && procesos.length > 0 && (
        <FormSelectField
          {...form.fieldProps("kind")}
          label="Proceso de trabajo"
          options={procesos.map((p) => ({ value: p.slug, label: p.name }))}
          defaultValue={procesos[0].slug}
        />
      )}
      {editar && proyecto && <input type="hidden" name="kind" value={proyecto.kind} />}

      <FormSelectField
        {...form.fieldProps("stage")}
        label="Etapa"
        options={OPCIONES_ETAPA}
        defaultValue={proyecto?.stage ?? SIN_OPCION}
      />

      {/* Subir la imagen se hace desde el detalle; acá solo por URL externa. */}
      <FormSelectField
        {...form.fieldProps("page_type")}
        label="Tipo de página"
        options={OPCIONES_TIPO}
        defaultValue={proyecto?.page_type ?? SIN_OPCION}
      />

      <FormTextField
        {...form.fieldProps("site_url")}
        label="Sitio publicado"
        placeholder="https://… (opcional)"
        defaultValue={proyecto?.site_url ?? ""}
      />

      {/* La portada usa un patrón común; el campo queda por si se retoma. */}
      {editar && proyecto?.cover_url && (
        <input type="hidden" name="cover_url" value={proyecto.cover_url} />
      )}

      {/* Escribe en notes_important, que es el campo que el detalle muestra
          bajo "Anotaciones importantes". */}
      <FormTextAreaField
        {...form.fieldProps("notes_important")}
        label="Notas"
        rows={3}
        placeholder="Lo que no se puede olvidar de este proyecto…"
        defaultValue={proyecto?.notes_important ?? ""}
      />
    </>
  );
}
