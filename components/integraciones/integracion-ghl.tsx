"use client";

import { useState, useTransition } from "react";
import { RefreshCircle1Clockwise } from "@tailgrids/icons";
import { toast } from "sonner";
import { z } from "zod";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { Campo, DialogoForm, Input, Select } from "@/components/landing/dialogo-form";
import { SeccionCard } from "@/components/landing/seccion-card";
import { Button } from "@/components/tailgrids/core/button";
import {
  agregarMapeoGhl,
  borrarMapeoGhl,
  desconectarGhl,
  guardarConexionGhl,
  quitarTokenGhl,
  sincronizarGhlAhora,
} from "@/app/landing-pages/integraciones-acciones";
import type { IntegracionUI, LandingOpcion, ResultadoSync } from "@/lib/integraciones/tipos";

/* Espejo de las reglas de app/landing-pages/integraciones-acciones.ts. */
const conexionEsquema = z.object({
  client_id: z.string(),
  location_id: z.string().trim().regex(/^[A-Za-z0-9_-]{6,64}$/, "El Location ID no parece válido"),
  token: z.string().optional(),
});
const mapeoEsquema = z.object({
  client_id: z.string(),
  tag: z.string().trim().min(1, "Falta la etiqueta"),
  page_id: z.string().min(1, "Elegí la landing"),
  amount: z.string().optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/, "3 letras, por ejemplo EUR"),
});

const FECHA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function ConexionForm({ clientId, integracion }: { clientId: string; integracion: IntegracionUI | null }) {
  return (
    <DialogoForm
      titulo="Conexión con GoHighLevel"
      etiquetaAbrir={integracion ? "Editar conexión" : "Conectar GoHighLevel"}
      action={guardarConexionGhl}
      schema={conexionEsquema}
    >
      <input type="hidden" name="client_id" value={clientId} />
      <Campo label="Location ID">
        <Input name="location_id" defaultValue={integracion?.location_id ?? ""} placeholder="Id de la sub-cuenta" required />
      </Campo>
      <Campo label={integracion?.tieneToken ? "Token nuevo (opcional)" : "Token de integración privada"}>
        <Input
          name="token"
          type="password"
          autoComplete="off"
          placeholder={integracion?.tieneToken ? "Dejalo vacío para conservar el guardado" : "pit-…"}
        />
      </Campo>
      <p className="text-xs text-text-tertiary">
        El token se guarda cifrado y no se vuelve a mostrar. Alcanza con permiso de lectura de contactos.
      </p>
    </DialogoForm>
  );
}

function MapeoForm({ clientId, landings }: { clientId: string; landings: LandingOpcion[] }) {
  return (
    <DialogoForm titulo="Mapear etiqueta a landing" etiquetaAbrir="Agregar etiqueta" action={agregarMapeoGhl} schema={mapeoEsquema}>
      <input type="hidden" name="client_id" value={clientId} />
      <Campo label="Etiqueta del contacto">
        <Input name="tag" placeholder="compra-bootcamp-oct26" required />
      </Campo>
      <Campo label="Landing donde cuenta la venta">
        <Select name="page_id" defaultValue="" required>
          <option value="" disabled>
            Elegí una landing
          </option>
          {landings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Precio de lista">
          <Input name="amount" inputMode="decimal" placeholder="297" />
        </Campo>
        <Campo label="Moneda">
          <Input name="currency" defaultValue="EUR" maxLength={3} required />
        </Campo>
      </div>
    </DialogoForm>
  );
}

function ResumenSync({ resultado, at }: { resultado: ResultadoSync; at: string | null }) {
  const etiquetas = Object.entries(resultado.porEtiqueta);
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <p className="text-text-tertiary">
        {at ? `Última sincronización: ${FECHA.format(new Date(at))}` : "Sin sincronizar"}
        {!resultado.completo && " · quedó a medias, la próxima corrida sigue donde quedó"}
      </p>
      {etiquetas.length > 0 && (
        <ul className="divide-y divide-card-border rounded-lg border border-card-border">
          {etiquetas.map(([tag, n]) => (
            <li key={tag} className="flex items-center justify-between gap-3 px-3 py-1.5">
              <span className="min-w-0 truncate font-medium text-text-primary">{tag}</span>
              <span className="shrink-0 tabular-nums text-text-tertiary">
                {n.encontrados.toLocaleString("es-AR")} encontradas · {n.nuevas.toLocaleString("es-AR")} nuevas
              </span>
            </li>
          ))}
        </ul>
      )}
      {resultado.errores.length > 0 && (
        <ul className="text-error-500">
          {resultado.errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Conexión del cliente con GoHighLevel y mapeo de etiquetas a ventas (solo owner). */
export function IntegracionGhl({
  clientId,
  integracion,
  landings,
}: {
  clientId: string;
  integracion: IntegracionUI | null;
  landings: LandingOpcion[];
}) {
  const [pendiente, iniciar] = useTransition();
  const [ultimo, setUltimo] = useState<ResultadoSync | null>(null);
  const resultado = ultimo ?? integracion?.last_sync_result ?? null;
  const nombreLanding = new Map(landings.map((l) => [l.id, l.label]));

  const sincronizar = () =>
    iniciar(async () => {
      const r = await sincronizarGhlAhora(clientId);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      setUltimo(r.resultado);
      if (r.resultado.errores.length > 0) toast.error(r.resultado.errores[0]);
      else toast.success(r.resultado.completo ? "Sincronización completa" : "Sincronización parcial: seguirá en la próxima corrida");
    });

  const accion = <ConexionForm clientId={clientId} integracion={integracion} />;

  return (
    <SeccionCard titulo="Integración GoHighLevel" accion={accion}>
      {!integracion ? (
        <p className="px-4 py-6 text-sm text-text-tertiary">
          Conectala para importar las ventas por etiqueta de contacto a las landings de venta del cliente.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 text-sm">
              <p className="truncate text-text-primary">
                Location ID: <span className="font-medium">{integracion.location_id ?? "—"}</span>
              </p>
              <p className="text-xs text-text-tertiary">{integracion.tieneToken ? "Token guardado" : "Sin token"}</p>
            </div>
            <span className="flex flex-wrap items-center gap-3">
              {integracion.tieneToken && (
                <BorrarBoton
                  etiqueta="Quitar token"
                  advertencia="Se borra el token guardado; para volver a sincronizar hay que cargar uno nuevo."
                  onConfirmar={() => quitarTokenGhl(clientId)}
                />
              )}
              <Button onPress={sincronizar} isDisabled={pendiente || !integracion.tieneToken || integracion.mapeos.length === 0}>
                <RefreshCircle1Clockwise />
                {pendiente ? "Sincronizando…" : "Sincronizar ahora"}
              </Button>
            </span>
          </div>

          <div className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-text-secondary">Etiquetas mapeadas ({integracion.mapeos.length})</p>
              <MapeoForm clientId={clientId} landings={landings} />
            </div>
            {integracion.mapeos.length === 0 ? (
              <p className="text-xs text-text-tertiary">Agregá la etiqueta que marca una compra (por ejemplo compra-bootcamp-oct26).</p>
            ) : (
              <ul className="divide-y divide-card-border rounded-lg border border-card-border">
                {integracion.mapeos.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text-primary">{m.tag}</span>
                      <span className="block truncate text-text-tertiary">
                        {nombreLanding.get(m.page_id) ?? "Landing"} ·{" "}
                        {m.amount === null ? "sin precio" : `${m.amount.toLocaleString("es-AR")} ${m.currency}`}
                      </span>
                    </span>
                    <BorrarBoton etiqueta="Quitar etiqueta" onConfirmar={() => borrarMapeoGhl(m.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(resultado || integracion.last_sync_at) && (
            <div className="px-4 py-3">
              {resultado ? (
                <ResumenSync resultado={resultado} at={resultado.at ?? integracion.last_sync_at} />
              ) : (
                <p className="text-xs text-text-tertiary">Sin resultado guardado.</p>
              )}
            </div>
          )}

          <div className="px-4 py-3">
            <BorrarBoton
              etiqueta="Desconectar GoHighLevel"
              advertencia="Se borran la conexión, el token y las etiquetas mapeadas. Las ventas ya importadas se conservan."
              onConfirmar={() => desconectarGhl(clientId)}
            />
          </div>
        </>
      )}
    </SeccionCard>
  );
}
