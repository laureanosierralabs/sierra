"use client";

import { Pencil } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { SelectorProyectos } from "@/components/landing/selector-proyectos";
import { guardarAcuerdo } from "@/app/landing-pages/acciones";
import {
  MONEDAS,
  type AcuerdoEquipo,
  type Cliente,
  type Proyecto,
} from "@/lib/landing/tipos";

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
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      {acuerdo && <input type="hidden" name="id" value={acuerdo.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Campo label="A quién se le paga">
          <Input
            name="member_name"
            required
            placeholder="Bruno"
            defaultValue={acuerdo?.member_name ?? ""}
          />
        </Campo>

        <Campo label="Concepto">
          <Input
            name="title"
            required
            placeholder="Misión Origen + Game"
            defaultValue={acuerdo?.title ?? ""}
          />
        </Campo>
      </div>

      {/* Sin proyectos vinculados es trabajo por horas: mantenimiento,
          cambios sueltos. El acuerdo funciona igual. */}
      <Campo label="Proyectos que cubre (opcional)">
        <SelectorProyectos
          proyectos={proyectos}
          clientePor={clientePor}
          defaultValue={acuerdo?.project_ids}
        />
      </Campo>

      <div className="grid grid-cols-3 gap-4">
        <Campo label="Monto acordado">
          <Input
            name="total_amount"
            inputMode="decimal"
            defaultValue={acuerdo?.total_amount?.toString() ?? ""}
          />
        </Campo>

        <Campo label="Moneda">
          <Select name="currency" defaultValue={acuerdo?.currency ?? "USD"}>
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Condiciones">
          <Input
            name="payment_terms"
            placeholder="2 pagos"
            defaultValue={acuerdo?.payment_terms ?? ""}
          />
        </Campo>
      </div>

      <Campo label="Notas">
        <Textarea name="notes" rows={2} defaultValue={acuerdo?.notes ?? ""} />
      </Campo>

      <p className="text-xs text-text-3">
        Lo pagado se registra desde el detalle, con su fecha.
      </p>
    </DialogoForm>
  );
}
