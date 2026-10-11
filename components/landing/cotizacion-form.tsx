"use client";

import { useState } from "react";
import { Pencil1 } from "@tailgrids/icons";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { cotizacionEsquema } from "@/components/landing/cotizacion-esquema";
import { DialogoForm, type ZodFormApi } from "@/components/landing/dialogo-form";
import { ItemsCotizacion, itemsIniciales } from "@/components/landing/items-cotizacion";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { guardarCotizacion } from "@/app/landing-pages/acciones";
import {
  ESTADOS_COTIZACION,
  LABEL_ESTADO_COTIZACION,
  MONEDAS,
  formatearMonto,
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

type Props = {
  clientes: Pick<Cliente, "id" | "name">[];
  proyectos: Pick<Proyecto, "id" | "name" | "client_id">[];
  cotizacion?: Cotizacion;
  clienteFijo?: string;
};

export function CotizacionForm(props: Props) {
  const editar = Boolean(props.cotizacion);

  return (
    <DialogoForm
      titulo={editar ? "Editar cotización" : "Nueva cotización"}
      etiquetaAbrir="Nueva cotización"
      action={guardar}
      schema={cotizacionEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
      ancho="2xl"
    >
      {(form) => <Campos form={form} {...props} />}
    </DialogoForm>
  );
}

/**
 * Vive dentro del diálogo: se monta al abrirlo, así el cliente elegido y la
 * cantidad de ítems arrancan de cero cada vez.
 */
function Campos({ form, clientes, proyectos, cotizacion, clienteFijo }: Props & { form: ZodFormApi }) {
  const clienteInicial = cotizacion?.client_id ?? clienteFijo ?? SIN_OPCION;
  const [cliente, setCliente] = useState(clienteInicial);
  const [{ items: iniciales, previos }] = useState(() => itemsIniciales(cotizacion, proyectos));
  const [conItems, setConItems] = useState(iniciales.length > 0);

  const opcionesCliente = [
    { value: SIN_OPCION, label: "Sin cliente" },
    ...clientes.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <>
      {cotizacion && <input type="hidden" name="id" value={cotizacion.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          {...form.fieldProps("client_id")}
          onChange={(valor) => {
            form.clearError("client_id");
            setCliente(valor);
          }}
          label="Cliente que paga"
          options={opcionesCliente}
          defaultValue={clienteInicial}
        />
        <FormTextField
          {...form.fieldProps("service")}
          label="Servicio"
          placeholder="Embudo de venta"
          description="Encabeza los ítems en el documento."
          defaultValue={cotizacion?.service ?? ""}
        />
      </div>

      <FormTextField
        {...form.fieldProps("title")}
        label="Título"
        required
        placeholder="Funnel completo + Automatización"
        defaultValue={cotizacion?.title ?? ""}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-input-label-text">Ítems</span>
        <ItemsCotizacion
          iniciales={iniciales}
          previos={previos}
          totalAnterior={
            cotizacion?.total_amount != null
              ? formatearMonto(cotizacion.total_amount, cotizacion.currency)
              : null
          }
          proyectos={proyectos}
          clienteId={cliente === SIN_OPCION ? null : cliente}
          error={form.errors.items}
          onCantidad={(n) => {
            form.clearError("items");
            setConItems(n > 0);
          }}
        />
        <p className="text-xs text-text-tertiary">
          Cada ítem puede ser un proyecto (una landing) o un servicio suelto. El total es la suma, y
          lo asignado a cada proyecto sale de su ítem.
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${conItems ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {/* Con ítems el total lo calcula el server: un campo que se ignora
            solo confunde. */}
        {!conItems && (
          <FormTextField
            {...form.fieldProps("total_amount")}
            label="Monto total"
            defaultValue={cotizacion?.total_amount?.toString() ?? ""}
          />
        )}
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
        description="Opcional: el documento para el cliente ya sale del link público."
        defaultValue={cotizacion?.proposal_url ?? ""}
      />

      <FormTextAreaField
        {...form.fieldProps("notes")}
        label="Notas"
        rows={3}
        defaultValue={cotizacion?.notes ?? ""}
      />
    </>
  );
}
