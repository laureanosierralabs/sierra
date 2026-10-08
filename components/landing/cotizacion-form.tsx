"use client";

import { Pencil1 } from "@tailgrids/icons";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { cotizacionEsquema } from "@/components/landing/cotizacion-esquema";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { SelectorProyectos } from "@/components/landing/selector-proyectos";
import { guardarCotizacion } from "@/app/landing-pages/acciones";
import {
  ESTADOS_COTIZACION,
  LABEL_ESTADO_COTIZACION,
  MONEDAS,
  type Cliente,
  type Cotizacion,
  type Proyecto,
} from "@/lib/landing/tipos";

const OPCIONES_MONEDA = MONEDAS.map((m) => ({ value: m, label: m }));

const OPCIONES_ESTADO = ESTADOS_COTIZACION.map((e) => ({
  value: e,
  label: LABEL_ESTADO_COTIZACION[e],
}));

/** Mismo FormData que antes: "sin cliente" viaja como cadena vacía. */
function guardar(fd: FormData) {
  if (fd.get("client_id") === SIN_OPCION) fd.set("client_id", "");
  return guardarCotizacion(fd);
}

export function CotizacionForm({
  clientes,
  proyectos,
  cotizacion,
  clienteFijo,
}: {
  clientes: Pick<Cliente, "id" | "name">[];
  proyectos: Pick<Proyecto, "id" | "name" | "client_id">[];
  cotizacion?: Cotizacion;
  clienteFijo?: string;
}) {
  const editar = Boolean(cotizacion);
  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));

  const opcionesCliente = [
    { value: SIN_OPCION, label: "Sin cliente" },
    ...clientes.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <DialogoForm
      titulo={editar ? "Editar cotización" : "Nueva cotización"}
      etiquetaAbrir="Nueva cotización"
      action={guardar}
      schema={cotizacionEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          {cotizacion && <input type="hidden" name="id" value={cotizacion.id} />}

          <FormTextField
            {...form.fieldProps("title")}
            label="Título"
            required
            placeholder="Bootcamp + Misión Origen + Game"
            defaultValue={cotizacion?.title ?? ""}
          />

          <FormSelectField
            {...form.fieldProps("client_id")}
            label="Cliente que paga"
            options={opcionesCliente}
            defaultValue={cotizacion?.client_id ?? clienteFijo ?? SIN_OPCION}
          />

          {/* El cliente que paga puede no ser el del proyecto: una agencia
              intermediaria factura el trabajo hecho para su propio cliente. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-input-label-text">Proyectos que cubre</span>
            <SelectorProyectos
              proyectos={proyectos}
              clientePor={clientePor}
              defaultValue={cotizacion?.project_ids}
              asignado={cotizacion?.allocated ?? {}}
              moneda={cotizacion?.currency ?? "USD"}
            />
            <p className="text-xs text-text-tertiary">
              El monto de cada proyecto es opcional. Sin él, la rentabilidad de ese proyecto queda
              sin asignar en vez de repartirse por promedio.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormTextField
              {...form.fieldProps("total_amount")}
              label="Monto total"
              defaultValue={cotizacion?.total_amount?.toString() ?? ""}
            />
            <FormSelectField
              {...form.fieldProps("currency")}
              label="Moneda"
              options={OPCIONES_MONEDA}
              defaultValue={cotizacion?.currency ?? "USD"}
            />
            <FormSelectField
              {...form.fieldProps("commercial_status")}
              label="Estado comercial"
              options={OPCIONES_ESTADO}
              defaultValue={cotizacion?.commercial_status ?? "draft"}
            />
          </div>

          {/* Lo cobrado no se escribe acá: sale de los cobros registrados en el
              detalle, cada uno con su fecha. */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("payment_terms")}
              label="Condiciones de pago"
              placeholder="2 pagos / Pago único"
              defaultValue={cotizacion?.payment_terms ?? ""}
            />
            <FormTextField
              {...form.fieldProps("sent_at")}
              type="date"
              label="Fecha de envío"
              defaultValue={cotizacion?.sent_at ?? ""}
            />
          </div>

          <FormTextField
            {...form.fieldProps("proposal_url")}
            label="Link a la propuesta"
            placeholder="https://drive.google.com/… (opcional)"
            defaultValue={cotizacion?.proposal_url ?? ""}
          />

          <FormTextAreaField
            {...form.fieldProps("notes")}
            label="Notas"
            rows={3}
            defaultValue={cotizacion?.notes ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}
