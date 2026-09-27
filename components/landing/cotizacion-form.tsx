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
import { guardarCotizacion } from "@/app/landing-pages/acciones";
import {
  ESTADOS_COTIZACION,
  LABEL_ESTADO_COTIZACION,
  MONEDAS,
  type Cliente,
  type Cotizacion,
  type Proyecto,
} from "@/lib/landing/tipos";

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

  return (
    <DialogoForm
      titulo={editar ? "Editar cotización" : "Nueva cotización"}
      etiquetaAbrir="Nueva cotización"
      action={guardarCotizacion}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      {cotizacion && <input type="hidden" name="id" value={cotizacion.id} />}

      <Campo label="Título">
        <Input
          name="title"
          required
          placeholder="Bootcamp + Misión Origen + Game"
          defaultValue={cotizacion?.title ?? ""}
        />
      </Campo>

      <Campo label="Cliente que paga">
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

      {/* El cliente que paga puede no ser el del proyecto: una agencia
          intermediaria factura el trabajo hecho para su propio cliente. */}
      <Campo label="Proyectos que cubre">
        <SelectorProyectos
          proyectos={proyectos}
          clientePor={clientePor}
          defaultValue={cotizacion?.project_ids}
          asignado={cotizacion?.allocated ?? {}}
          moneda={cotizacion?.currency ?? "USD"}
        />
        <p className="mt-1 text-xs text-text-3">
          El monto de cada proyecto es opcional. Sin él, la rentabilidad de
          ese proyecto queda sin asignar en vez de repartirse por promedio.
        </p>
      </Campo>

      <div className="grid grid-cols-3 gap-4">
        <Campo label="Monto total">
          <Input
            name="total_amount"
            inputMode="decimal"
            defaultValue={cotizacion?.total_amount?.toString() ?? ""}
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

        <Campo label="Estado comercial">
          <Select
            name="commercial_status"
            defaultValue={cotizacion?.commercial_status ?? "draft"}
          >
            {ESTADOS_COTIZACION.map((e) => (
              <option key={e} value={e}>
                {LABEL_ESTADO_COTIZACION[e]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      {/* Lo cobrado no se escribe acá: sale de los cobros registrados en el
          detalle, cada uno con su fecha. */}

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Condiciones de pago">
          <Input
            name="payment_terms"
            placeholder="2 pagos / Pago único"
            defaultValue={cotizacion?.payment_terms ?? ""}
          />
        </Campo>

        <Campo label="Fecha de envío">
          <Input
            type="date"
            name="sent_at"
            defaultValue={cotizacion?.sent_at ?? ""}
          />
        </Campo>
      </div>

      <Campo label="Link a la propuesta">
        <Input
          name="proposal_url"
          placeholder="https://drive.google.com/… (opcional)"
          defaultValue={cotizacion?.proposal_url ?? ""}
        />
      </Campo>

      <Campo label="Notas">
        <Textarea name="notes" rows={3} defaultValue={cotizacion?.notes ?? ""} />
      </Campo>
    </DialogoForm>
  );
}
