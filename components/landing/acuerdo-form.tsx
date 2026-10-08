"use client";

import { Pencil1 } from "@tailgrids/icons";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { acuerdoEsquema } from "@/components/landing/acuerdo-esquema";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SelectorProyectos } from "@/components/landing/selector-proyectos";
import { guardarAcuerdo } from "@/app/landing-pages/acciones";
import { MONEDAS, type AcuerdoEquipo, type Cliente, type Proyecto } from "@/lib/landing/tipos";

const OPCIONES_MONEDA = MONEDAS.map((m) => ({ value: m, label: m }));

export function AcuerdoForm({
  proyectos,
  clientes,
  acuerdo,
}: {
  proyectos: Pick<Proyecto, "id" | "name" | "client_id">[];
  clientes: Pick<Cliente, "id" | "name">[];
  acuerdo?: AcuerdoEquipo;
}) {
  const editar = Boolean(acuerdo);
  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));

  return (
    <DialogoForm
      titulo={editar ? "Editar acuerdo" : "Nuevo acuerdo"}
      etiquetaAbrir="Nuevo acuerdo"
      action={guardarAcuerdo}
      schema={acuerdoEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          {acuerdo && <input type="hidden" name="id" value={acuerdo.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("member_name")}
              label="A quién se le paga"
              required
              placeholder="Bruno"
              defaultValue={acuerdo?.member_name ?? ""}
            />
            <FormTextField
              {...form.fieldProps("title")}
              label="Concepto"
              required
              placeholder="Misión Origen + Game"
              defaultValue={acuerdo?.title ?? ""}
            />
          </div>

          {/* Sin proyectos vinculados es trabajo por horas: mantenimiento,
              cambios sueltos. El acuerdo funciona igual. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-input-label-text">
              Proyectos que cubre (opcional)
            </span>
            <SelectorProyectos
              proyectos={proyectos}
              clientePor={clientePor}
              defaultValue={acuerdo?.project_ids}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormTextField
              {...form.fieldProps("total_amount")}
              label="Monto acordado"
              defaultValue={acuerdo?.total_amount?.toString() ?? ""}
            />
            <FormSelectField
              {...form.fieldProps("currency")}
              label="Moneda"
              options={OPCIONES_MONEDA}
              defaultValue={acuerdo?.currency ?? "USD"}
            />
            {/* Cuándo se acordó, no cuándo se carga el dato: el balance
                mensual necesita la fecha real del hecho. */}
            <FormTextField
              {...form.fieldProps("agreed_on")}
              type="date"
              label="Fecha del acuerdo"
              defaultValue={acuerdo?.agreed_on ?? ""}
            />
          </div>

          <FormTextField
            {...form.fieldProps("payment_terms")}
            label="Condiciones de pago"
            placeholder="2 pagos"
            defaultValue={acuerdo?.payment_terms ?? ""}
          />

          <FormTextAreaField
            {...form.fieldProps("notes")}
            label="Notas"
            rows={2}
            defaultValue={acuerdo?.notes ?? ""}
          />

          <p className="text-xs text-text-tertiary">
            Lo pagado se registra desde el detalle, con su fecha.
          </p>
        </>
      )}
    </DialogoForm>
  );
}
