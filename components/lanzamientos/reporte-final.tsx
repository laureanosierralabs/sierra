"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/common/form/form-error";
import { Button } from "@/components/tailgrids/core/button";
import { TextArea } from "@/components/tailgrids/core/text-area";
import {
  aprobarYEnviarFinal,
  generarBorradorFinal,
  guardarBorradorFinal,
} from "@/app/landing-pages/lanzamiento-acciones";

type Accion = "generar" | "guardar" | "aprobar";

/**
 * Reporte final al cliente: la IA deja un borrador del análisis cuando termina
 * el lanzamiento (o se genera a mano en cualquier momento), el owner lo edita
 * y recién al aprobarlo se manda por mail y pasa a las conclusiones del reporte
 * de cierre que ve el cliente en el portal.
 */
export function ReporteFinal({
  launchId,
  borrador,
  borradorAt,
  finalEnviado,
  cantidadDestinatarios,
  resendListo,
}: {
  launchId: string;
  borrador: string | null;
  borradorAt: string | null;
  finalEnviado: string | null;
  cantidadDestinatarios: number;
  resendListo: boolean;
}) {
  const [texto, setTexto] = useState(borrador ?? "");
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [pendiente, iniciar] = useTransition();

  const puedeEnviar = resendListo && cantidadDestinatarios > 0 && !finalEnviado;

  function ejecutar(cual: Accion) {
    if (cual === "generar" && texto.trim() && !window.confirm("Ya hay un texto: el borrador nuevo lo reemplaza. ¿Seguimos?")) return;
    if (
      cual === "aprobar" &&
      !window.confirm(
        `Se le manda ahora al cliente (${cantidadDestinatarios} ${cantidadDestinatarios === 1 ? "contacto" : "contactos"}) y el texto queda en su reporte de cierre. ¿Aprobar y enviar?`,
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set("launch_id", launchId);
    fd.set("final_draft", texto);
    setError(null);
    setAccion(cual);
    iniciar(async () => {
      try {
        const r =
          cual === "generar"
            ? await generarBorradorFinal(fd)
            : cual === "guardar"
              ? await guardarBorradorFinal(fd)
              : await aprobarYEnviarFinal(fd);
        if (r && "error" in r && r.error) {
          setError(r.error);
          toast.error(r.error);
          return;
        }
        if (r && "borrador" in r && typeof r.borrador === "string") setTexto(r.borrador);
        if (r && "aviso" in r) toast.success(r.aviso, { duration: 8000 });
      } catch {
        setError("No se pudo completar la acción: probá de nuevo");
      } finally {
        setAccion(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {finalEnviado ? (
        <p className="rounded-lg border border-card-border bg-base-50 px-3 py-2 text-sm text-text-secondary">
          El reporte final ya se envió al cliente.
        </p>
      ) : (
        <p className="text-sm text-text-tertiary">
          Al terminar el lanzamiento la IA prepara un borrador del análisis y te avisa por mail. Revisalo, editalo y
          aprobalo: recién ahí se le manda al cliente.
          {borradorAt ? ` Último borrador generado el ${new Date(borradorAt).toLocaleDateString("es-AR")}.` : ""}
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-input-label-text">Análisis del lanzamiento</span>
        <TextArea
          name="final_draft"
          rows={14}
          maxLength={10_000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={Boolean(finalEnviado)}
          placeholder="Todavía no hay borrador. Generalo con IA o escribilo a mano."
          className="w-full"
        />
        <span className="text-xs text-text-tertiary">
          La IA se basa solo en los números del lanzamiento. Revisá que no afirme nada que no puedas sostener.
        </span>
      </label>
      <FormError message={error} />
      {!puedeEnviar && !finalEnviado && (
        <p className="text-xs text-text-tertiary">
          {!resendListo
            ? "Para enviar hace falta configurar Resend."
            : "Para enviar hace falta cargar al menos un email en el reporte diario."}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" appearance="outline" isDisabled={pendiente || Boolean(finalEnviado)} onClick={() => ejecutar("generar")}>
          {accion === "generar" ? "Generando…" : "Generar borrador con IA"}
        </Button>
        <Button type="button" appearance="outline" isDisabled={pendiente || Boolean(finalEnviado)} onClick={() => ejecutar("guardar")}>
          {accion === "guardar" ? "Guardando…" : "Guardar"}
        </Button>
        <Button type="button" isDisabled={pendiente || !puedeEnviar || !texto.trim()} onClick={() => ejecutar("aprobar")}>
          {accion === "aprobar" ? "Enviando…" : "Aprobar y enviar al cliente"}
        </Button>
      </div>
    </div>
  );
}
