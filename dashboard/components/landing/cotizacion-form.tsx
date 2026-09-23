"use client";

import { Pencil } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { guardarCotizacion } from "@/app/landing-pages/acciones";
import {
  ESTADOS_COTIZACION,
  LABEL_ESTADO_COTIZACION,
  MONEDAS,
  type Cliente,
  type Cotizacion,
} from "@/lib/landing/tipos";

export function CotizacionForm({
  clientes,
  cotizacion,
  clienteFijo,
}: {
  clientes: Pick<Cliente, "id" | "name">[];
  cotizacion?: Cotizacion;
  clienteFijo?: string;
}) {
  const editar = Boolean(cotizacion);

  return (
    <DialogoForm
      titulo={editar ? "Editar cotización" : "Nueva cotización"}
      etiquetaAbrir="Nueva cotización"
      action={guardarCotizacion}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      {cotizacion && <input type="hidden" name="id" value={cotizacion.id} />}

      <Campo label="Título">
        <Input name="title" required defaultValue={cotizacion?.title ?? ""} />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Cliente">
          <Select
            name="client_id"
            defaultValue={cotizacion?.client_id ?? clienteFijo ?? ""}
          >
            <option value="">Sin cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Servicio">
          <Input name="service" defaultValue={cotizacion?.service ?? ""} />
        </Campo>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Campo label="Monto">
          <Input
            name="amount"
            inputMode="decimal"
            defaultValue={cotizacion?.amount?.toString() ?? ""}
          />
        </Campo>

        <Campo label="Moneda">
          <Select name="currency" defaultValue={cotizacion?.currency ?? "USD"}>
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Estado">
          <Select name="status" defaultValue={cotizacion?.status ?? "borrador"}>
            {ESTADOS_COTIZACION.map((e) => (
              <option key={e} value={e}>
                {LABEL_ESTADO_COTIZACION[e]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Fecha de envío">
          <Input
            type="date"
            name="sent_at"
            defaultValue={cotizacion?.sent_at ?? ""}
          />
        </Campo>

        <Campo label="URL de la propuesta">
          <Input
            name="proposal_url"
            placeholder="https://…"
            defaultValue={cotizacion?.proposal_url ?? ""}
          />
        </Campo>
      </div>

      <Campo label="Notas">
        <Textarea name="notes" rows={3} defaultValue={cotizacion?.notes ?? ""} />
      </Campo>
    </DialogoForm>
  );
}
