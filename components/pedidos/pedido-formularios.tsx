"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/common/form/form-error";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { Campo, DialogoForm, Input, Select, Textarea } from "@/components/landing/dialogo-form";
import { Button } from "@/components/tailgrids/core/button";
import {
  ACCION_ESTADO,
  AYUDA_TIPO_PEDIDO,
  LABEL_TIPO_PEDIDO,
  TIPOS_DEL_CLIENTE,
  type EstadoPedido,
} from "@/lib/pedidos/tipos";

type Accion = (fd: FormData) => Promise<{ error: string } | { aviso: string }>;
type Lanzamiento = { id: string; name: string };

/** Mismo aspecto que un botón del template, para usar como disparador de un diálogo. */
const BOTON = {
  primario:
    "inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600",
  contorno:
    "inline-flex items-center gap-1.5 rounded-lg border border-button-primary-outline-stroke px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background-gray-secondary",
};

function SelectorLanzamiento({ lanzamientos }: { lanzamientos: Lanzamiento[] }) {
  if (lanzamientos.length === 0) return null;
  return (
    <Campo label="Lanzamiento (opcional)">
      <Select name="launch_id" defaultValue="">
        <option value="">Ninguno en particular</option>
        {lanzamientos.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
    </Campo>
  );
}

/** Caja para responder en el hilo. Se vacía al enviar. */
export function FormComentario({
  action,
  campos,
  placeholder = "Escribí un comentario…",
}: {
  action: Accion;
  campos: Record<string, string>;
  placeholder?: string;
}) {
  const formulario = useRef<HTMLFormElement>(null);
  const form = useZodForm({ action, onSuccess: () => formulario.current?.reset() });
  return (
    <form ref={formulario} onSubmit={form.onSubmit} className="flex flex-col gap-2">
      {Object.entries(campos).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Textarea name="body" rows={3} required maxLength={5000} placeholder={placeholder} aria-label="Comentario" />
      <FormError message={form.formError} />
      <Button type="submit" className="self-end" isDisabled={form.pending}>
        {form.pending ? "Enviando…" : "Enviar"}
      </Button>
    </form>
  );
}

/** El cliente reporta una incidencia o pide un cambio desde su portal. */
export function NuevoPedido({
  action,
  slug,
  lanzamientos,
}: {
  action: Accion;
  slug: string;
  lanzamientos: Lanzamiento[];
}) {
  return (
    <DialogoForm
      titulo="Nuevo pedido"
      action={action}
      etiquetaEnviar="Enviar pedido"
      etiquetaEnviando="Enviando…"
      disparador={<span className={BOTON.primario}>Nuevo pedido</span>}
    >
      <input type="hidden" name="slug" value={slug} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-input-label-text">¿Qué necesitás?</legend>
        {TIPOS_DEL_CLIENTE.map((t, i) => (
          <label
            key={t}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-card-border p-3 has-[:checked]:border-primary-500"
          >
            <input type="radio" name="kind" value={t} defaultChecked={i === 0} className="mt-1" />
            <span>
              <span className="block text-sm font-medium text-text-primary">{LABEL_TIPO_PEDIDO[t]}</span>
              <span className="block text-sm text-text-tertiary">{AYUDA_TIPO_PEDIDO[t]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Campo label="Título">
        <Input name="title" required maxLength={200} placeholder="El formulario de la Lista de Espera no envía" />
      </Campo>
      <Campo label="Detalle">
        <Textarea
          name="description"
          rows={4}
          maxLength={5000}
          placeholder="Qué pasa, dónde lo viste y desde qué dispositivo."
        />
      </Campo>
      <Campo label="Link (opcional)">
        <Input name="link" type="url" placeholder="https://…" />
      </Campo>
      <SelectorLanzamiento lanzamientos={lanzamientos} />
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" name="priority" value="urgente" />
        Es urgente: está frenando ventas o registros
      </label>
    </DialogoForm>
  );
}

/** El equipo le pide al cliente que apruebe algo. */
export function NuevaAprobacion({
  action,
  clientId,
  lanzamientos,
}: {
  action: Accion;
  clientId: string;
  lanzamientos: Lanzamiento[];
}) {
  return (
    <DialogoForm
      titulo="Pedir aprobación"
      action={action}
      etiquetaEnviar="Enviar al cliente"
      etiquetaEnviando="Enviando…"
      disparador={<span className={BOTON.contorno}>Pedir aprobación</span>}
    >
      <input type="hidden" name="client_id" value={clientId} />
      <Campo label="Qué tiene que aprobar">
        <Input name="title" required maxLength={200} placeholder="Copy de la Activación V2" />
      </Campo>
      <Campo label="Detalle">
        <Textarea name="description" rows={4} maxLength={5000} placeholder="Qué cambió y qué necesitamos que mire." />
      </Campo>
      <Campo label="Link a lo que hay que ver">
        <Input name="link" type="url" placeholder="https://… (la landing, un Figma, un Doc)" />
      </Campo>
      <SelectorLanzamiento lanzamientos={lanzamientos} />
      <p className="text-xs text-text-tertiary">El cliente la ve en su portal y la aprueba o pide cambios.</p>
    </DialogoForm>
  );
}

/** Aprobar o pedir cambios. Pedir cambios exige decir cuáles. */
export function DecidirAprobacion({
  action,
  slug,
  requestId,
}: {
  action: Accion;
  slug: string;
  requestId: string;
}) {
  const ocultos = (
    <>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="request_id" value={requestId} />
    </>
  );
  return (
    <div className="flex flex-wrap gap-2">
      <DialogoForm
        titulo="Aprobar"
        action={action}
        etiquetaEnviar="Aprobar"
        etiquetaEnviando="Aprobando…"
        disparador={<span className={BOTON.primario}>Aprobar</span>}
      >
        {ocultos}
        <input type="hidden" name="decision" value="aprobada" />
        <Campo label="Comentario (opcional)">
          <Textarea name="body" rows={3} maxLength={5000} placeholder="¡Quedó genial!" />
        </Campo>
      </DialogoForm>
      <DialogoForm
        titulo="Pedir cambios"
        action={action}
        etiquetaEnviar="Pedir cambios"
        etiquetaEnviando="Enviando…"
        disparador={<span className={BOTON.contorno}>Pedir cambios</span>}
      >
        {ocultos}
        <input type="hidden" name="decision" value="rechazada" />
        <Campo label="¿Qué cambiarías?">
          <Textarea name="body" rows={4} required maxLength={5000} placeholder="El título no me convence porque…" />
        </Campo>
      </DialogoForm>
    </div>
  );
}

/** Botones de cambio de estado del panel: solo los permitidos para ese pedido. */
export function AccionesEstado({
  transiciones,
  cambiar,
}: {
  transiciones: EstadoPedido[];
  cambiar: (estado: EstadoPedido) => Promise<{ error: string } | { aviso: string }>;
}) {
  const [pendiente, iniciar] = useTransition();
  if (transiciones.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {transiciones.map((estado, i) => (
        <Button
          key={estado}
          appearance={i === 0 ? "fill" : "outline"}
          isDisabled={pendiente}
          onPress={() =>
            iniciar(async () => {
              try {
                const r = await cambiar(estado);
                if ("error" in r) toast.error(r.error);
                else toast.success(r.aviso);
              } catch {
                toast.error("No se pudo cambiar el estado");
              }
            })
          }
        >
          {ACCION_ESTADO[estado]}
        </Button>
      ))}
    </div>
  );
}
