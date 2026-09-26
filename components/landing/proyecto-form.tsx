"use client";

import { Pencil } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { guardarProyecto } from "@/app/landing-pages/acciones";
import type { Proceso } from "@/lib/landing/tipos";
import {
  ESTADOS_PROYECTO,
  ETAPAS,
  PRIORIDADES,
  LABEL_ESTADO_PROYECTO,
  LABEL_ETAPA,
  LABEL_PRIORIDAD,
  LABEL_TIPO_PAGINA,
  TIPOS_PAGINA,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

/** Valores precargados al crear un proyecto desde una cotización aprobada. */
export interface DesdeCotizacion {
  quoteId: string;
  clientId: string | null;
  nombre: string;
}

export function ProyectoForm({
  miembros,
  clientes,
  procesos = [],
  proyecto,
  desdeCotizacion,
  etiqueta,
  disparador,
}: {
  miembros: Miembro[];
  clientes: Pick<Cliente, "id" | "name">[];
  procesos?: Pick<Proceso, "id" | "slug" | "name">[];
  proyecto?: Proyecto;
  desdeCotizacion?: DesdeCotizacion;
  etiqueta?: string;
  disparador?: React.ReactNode;
}) {
  const editar = Boolean(proyecto);

  return (
    <DialogoForm
      titulo={editar ? "Editar proyecto" : "Nuevo proyecto"}
      etiquetaAbrir={etiqueta ?? "Nuevo proyecto"}
      action={guardarProyecto}
      disparador={
        disparador ?? (editar ? <Pencil className="size-3.5" /> : undefined)
      }
    >
      {proyecto && <input type="hidden" name="id" value={proyecto.id} />}
      {desdeCotizacion && (
        <input type="hidden" name="quote_id" value={desdeCotizacion.quoteId} />
      )}
      {proyecto?.quote_id && !desdeCotizacion && (
        <input type="hidden" name="quote_id" value={proyecto.quote_id} />
      )}
      {/* client_name se conserva para no perder el dato de proyectos viejos */}
      {proyecto?.client_name && (
        <input type="hidden" name="client_name" value={proyecto.client_name} />
      )}

      <Campo label="Proyecto">
        <Input
          name="name"
          required
          defaultValue={proyecto?.name ?? desdeCotizacion?.nombre ?? ""}
        />
      </Campo>

      <Campo label="Cliente">
        <Select
          name="client_id"
          defaultValue={proyecto?.client_id ?? desdeCotizacion?.clientId ?? ""}
        >
          <option value="">
            {proyecto?.client_name
              ? `Sin vincular (${proyecto.client_name})`
              : "Sin cliente"}
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Estado">
          <Select name="status" defaultValue={proyecto?.status ?? "por-iniciar"}>
            {ESTADOS_PROYECTO.map((e) => (
              <option key={e} value={e}>
                {LABEL_ESTADO_PROYECTO[e]}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Prioridad">
          <Select name="priority" defaultValue={proyecto?.priority ?? "media"}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {LABEL_PRIORIDAD[p]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Responsable">
          <Select
            name="responsible_user_id"
            defaultValue={proyecto?.responsible_user_id ?? ""}
          >
            <option value="">Sin asignar</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Deadline">
          <Input
            type="date"
            name="due_date"
            defaultValue={proyecto?.due_date ?? ""}
          />
        </Campo>
      </div>

      {/* Solo al crear: cambiarlo después no recrearía las tareas ya hechas. */}
      {!editar && procesos.length > 0 && (
        <Campo label="Proceso de trabajo">
          <Select name="kind" defaultValue={procesos[0].slug}>
            {procesos.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </Select>
        </Campo>
      )}
      {editar && proyecto && (
        <input type="hidden" name="kind" value={proyecto.kind} />
      )}

      <Campo label="Etapa">
        <Select name="stage" defaultValue={proyecto?.stage ?? ""}>
          <option value="">Sin etapa</option>
          {ETAPAS.map((e) => (
            <option key={e} value={e}>
              {LABEL_ETAPA[e]}
            </option>
          ))}
        </Select>
      </Campo>

      {/* Subir la imagen se hace desde el detalle; acá solo por URL externa. */}
      <Campo label="Tipo de página">
        <Select name="page_type" defaultValue={proyecto?.page_type ?? ""}>
          <option value="">Sin definir</option>
          {TIPOS_PAGINA.map((t) => (
            <option key={t} value={t}>
              {LABEL_TIPO_PAGINA[t]}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo label="Sitio publicado">
        <Input
          name="site_url"
          placeholder="https://… (opcional)"
          defaultValue={proyecto?.site_url ?? ""}
        />
      </Campo>

      {/* La portada usa un patrón común; el campo queda por si se retoma. */}
      {editar && proyecto?.cover_url && (
        <input type="hidden" name="cover_url" value={proyecto.cover_url} />
      )}

      <Campo label="Notas">
        {/* Escribe en notes_important, que es el campo que el detalle muestra
            bajo "Anotaciones importantes". Antes iba a `notes`, que se
            guardaba pero no se veía en ninguna pantalla. */}
        <Textarea
          name="notes_important"
          rows={3}
          placeholder="Lo que no se puede olvidar de este proyecto…"
          defaultValue={proyecto?.notes_important ?? ""}
        />
      </Campo>
    </DialogoForm>
  );
}
