"use client";

import { useState, useTransition } from "react";
import { Copy1, Pencil1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { z } from "zod";
import { FormSelectField, FormTextField } from "@/components/common/form/form-fields";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { DialogoForm, Select } from "@/components/landing/dialogo-form";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { Button } from "@/components/tailgrids/core/button";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import {
  leerRegistros,
  TOPE_ARCHIVO_BYTES,
  TOPE_ENVIO_BYTES,
  TOPE_IMPORTACION,
  type ResultadoImportacion,
} from "@/lib/lanzamientos/importar";
import {
  agregarLandingsDesdeProyectos,
  borrarLanzamiento,
  borrarPaginaLanzamiento,
  conectarMailerlite,
  desconectarMailerlite,
  importarRegistros,
  guardarLanzamiento,
  guardarPaginaLanzamiento,
  type GrupoMailerlite,
} from "@/app/landing-pages/lanzamiento-acciones";
import type { ConexionLanzamiento } from "@/lib/lanzamientos/datos";
import {
  ESTADOS_LANZAMIENTO,
  LABEL_ESTADO_LANZAMIENTO,
  LABEL_TIPO_LANDING,
  TIPOS_LANDING,
  type Lanzamiento,
  type PaginaLanzamiento,
} from "@/lib/lanzamientos/tipos";

/* Espejo de las reglas de app/landing-pages/lanzamiento-acciones.ts. */
const fechaOpcional = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Fecha inválida").optional();
const linkOpcional = z
  .string()
  .trim()
  .regex(/^(https?:\/\/.+)?$/i, "Tiene que empezar con http:// o https://")
  .optional();

const lanzamientoEsquema = z
  .object({
    id: z.string().optional(),
    client_id: z.string().optional(),
    name: z.string().trim().min(1, "Falta el nombre del lanzamiento"),
    status: z.enum(ESTADOS_LANZAMIENTO, { error: "Estado inválido" }),
    starts_on: fechaOpcional,
    ends_on: fechaOpcional,
    goal_registrations: z.string().trim().regex(/^([1-9]\d*)?$/, "Un número entero mayor a cero").optional(),
  })
  .refine((v) => !v.starts_on || !v.ends_on || v.ends_on >= v.starts_on, {
    path: ["ends_on"],
    message: "El cierre no puede ser anterior al inicio",
  });

const paginaEsquema = z.object({
  id: z.string().optional(),
  launch_id: z.string(),
  name: z.string().trim().min(1, "Falta el nombre de la landing"),
  url: linkOpcional,
  thanks_url: linkOpcional,
  whatsapp_url: linkOpcional,
  checkout_url: linkOpcional,
  mailerlite_group_id: z.string().optional(),
  project_id: z.string().optional(),
  site_id: z.string().optional(),
  kind: z.enum(TIPOS_LANDING),
  path: z
    .string()
    .trim()
    .regex(/^(\/\S*)?$/, "La ruta empieza con / (por ejemplo /registro-a)")
    .optional(),
});

const OPCIONES_ESTADO = ESTADOS_LANZAMIENTO.map((e) => ({
  value: e,
  label: LABEL_ESTADO_LANZAMIENTO[e],
}));

export function LanzamientoForm({
  clientId,
  lanzamiento,
}: {
  /** Para crear. Al editar, el cliente no cambia. */
  clientId?: string;
  lanzamiento?: Lanzamiento;
}) {
  return (
    <DialogoForm
      titulo={lanzamiento ? "Editar lanzamiento" : "Nuevo lanzamiento"}
      etiquetaAbrir="Nuevo lanzamiento"
      action={guardarLanzamiento}
      schema={lanzamientoEsquema}
      disparador={lanzamiento ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          {lanzamiento && <input type="hidden" name="id" value={lanzamiento.id} />}
          {clientId && <input type="hidden" name="client_id" value={clientId} />}

          <FormTextField
            {...form.fieldProps("name")}
            label="Nombre"
            required
            placeholder="Academia ADN · Octubre"
            defaultValue={lanzamiento?.name ?? ""}
          />
          <FormSelectField
            {...form.fieldProps("status")}
            label="Estado"
            options={OPCIONES_ESTADO}
            defaultValue={lanzamiento?.status ?? "preparacion"}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("starts_on")}
              type="date"
              label="Inicio"
              defaultValue={lanzamiento?.starts_on ?? ""}
            />
            <FormTextField
              {...form.fieldProps("ends_on")}
              type="date"
              label="Cierre"
              defaultValue={lanzamiento?.ends_on ?? ""}
            />
          </div>
          <FormTextField
            {...form.fieldProps("goal_registrations")}
            label="Meta de registros"
            placeholder="1000"
            description="Opcional. Con meta y fechas, el panel muestra a cuánto llega el ritmo actual."
            defaultValue={lanzamiento?.goal_registrations?.toString() ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}

export function BorrarLanzamiento({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Borrar lanzamiento"
      advertencia="Se borran sus landings y todos los registros recibidos."
      onConfirmar={() => borrarLanzamiento(id)}
    />
  );
}

/** "Sin proyecto" y "landing suelta" viajan como cadena vacía. */
function guardarPagina(fd: FormData) {
  if (fd.get("project_id") === SIN_OPCION) fd.set("project_id", "");
  if (fd.get("site_id") === SIN_OPCION) fd.set("site_id", "");
  return guardarPaginaLanzamiento(fd);
}

/** Proyecto conectado del cliente, con las rutas que ya detectó. */
export interface SitioParaLanding {
  id: string;
  name: string;
  rutas: string[];
}

export function PaginaLanzamientoForm({
  launchId,
  pagina,
  proyectos,
  sitios = [],
}: {
  launchId: string;
  pagina?: PaginaLanzamiento;
  proyectos: { id: string; name: string }[];
  sitios?: SitioParaLanding[];
}) {
  const rutasConocidas = [...new Set(sitios.flatMap((s) => s.rutas))];
  const opcionesProyecto = [
    { value: SIN_OPCION, label: "Sin proyecto" },
    ...proyectos.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <DialogoForm
      titulo={pagina ? "Editar landing" : "Agregar landing"}
      etiquetaAbrir="Agregar landing"
      action={guardarPagina}
      schema={paginaEsquema}
      disparador={pagina ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          <input type="hidden" name="launch_id" value={launchId} />
          {pagina && <input type="hidden" name="id" value={pagina.id} />}

          <FormTextField
            {...form.fieldProps("name")}
            label="Nombre"
            required
            placeholder="Registro A"
            defaultValue={pagina?.name ?? ""}
          />
          <FormSelectField
            {...form.fieldProps("kind")}
            label="Tipo"
            description="De registro convierte en registros; de venta, en compras."
            options={TIPOS_LANDING.map((t) => ({ value: t, label: LABEL_TIPO_LANDING[t] }))}
            defaultValue={pagina?.kind ?? "registro"}
          />
          {sitios.length > 0 && (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-card-border p-3 sm:grid-cols-2">
              <FormSelectField
                {...form.fieldProps("site_id")}
                label="Proyecto conectado"
                description="Con el kit instalado, visitas y registros llegan solos por la ruta."
                options={[
                  { value: SIN_OPCION, label: "Ninguno (landing suelta)" },
                  ...sitios.map((s) => ({ value: s.id, label: s.name })),
                ]}
                defaultValue={pagina?.site_id ?? SIN_OPCION}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-input-label-text">Ruta</span>
                <input
                  name="path"
                  list={`rutas-${launchId}`}
                  placeholder="/registro-a"
                  defaultValue={pagina?.path ?? ""}
                  onChange={() => form.clearError("path")}
                  className="rounded-lg border border-card-border bg-input-background px-4 py-2.5 text-title-50 outline-none duration-300 placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20"
                />
                <datalist id={`rutas-${launchId}`}>
                  {rutasConocidas.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
                {form.errors.path && <span className="text-sm text-input-error">{form.errors.path}</span>}
              </label>
            </div>
          )}
          <FormTextField
            {...form.fieldProps("url")}
            label="URL de la landing"
            placeholder="https://…"
            defaultValue={pagina?.url ?? ""}
          />
          <FormTextField
            {...form.fieldProps("mailerlite_group_id")}
            label="Grupo de MailerLite (id)"
            placeholder="123456789012345678"
            description="Solo para landings sueltas (sin proyecto conectado): el grupo al que suma a quien se registra."
            defaultValue={pagina?.mailerlite_group_id ?? ""}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("thanks_url")}
              label="Página de gracias"
              placeholder="https://…"
              defaultValue={pagina?.thanks_url ?? ""}
            />
            <FormTextField
              {...form.fieldProps("whatsapp_url")}
              label="Link al grupo de WhatsApp"
              placeholder="https://chat.whatsapp.com/…"
              defaultValue={pagina?.whatsapp_url ?? ""}
            />
          </div>
          <FormTextField
            {...form.fieldProps("checkout_url")}
            label="Checkout"
            placeholder="https://…"
            defaultValue={pagina?.checkout_url ?? ""}
          />
          <FormSelectField
            {...form.fieldProps("project_id")}
            label="Proyecto"
            options={opcionesProyecto}
            defaultValue={pagina?.project_id ?? SIN_OPCION}
          />
        </>
      )}
    </DialogoForm>
  );
}

export function BorrarPaginaLanzamiento({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Quitar landing"
      advertencia="Sus registros quedan en el lanzamiento, sin landing asignada."
      onConfirmar={() => borrarPaginaLanzamiento(id)}
    />
  );
}

const FECHA_HORA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Conexión con MailerLite: crea el webhook con la API key del cliente (que
 * se usa una vez y no se guarda) y muestra los grupos para mapear landings.
 */
export function ConexionMailerlite({
  launchId,
  conexion,
}: {
  launchId: string;
  conexion: ConexionLanzamiento;
}) {
  const [pendiente, iniciar] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [grupos, setGrupos] = useState<GrupoMailerlite[] | null>(null);

  const rutaWebhook = `/api/webhooks/mailerlite/${conexion.webhookToken}`;

  async function copiar(texto: string, aviso: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(aviso);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function desconectar() {
    iniciar(async () => {
      const fd = new FormData();
      fd.set("launch_id", launchId);
      fd.set("api_key", apiKey);
      try {
        const resultado = await desconectarMailerlite(fd);
        if (resultado && "error" in resultado) {
          toast.error(resultado.error);
          return;
        }
        setGrupos(null);
        setApiKey("");
        if (resultado) toast.success(resultado.aviso, { duration: 8000 });
      } catch {
        toast.error("No se pudo desconectar MailerLite");
      }
    });
  }

  function conectar() {
    iniciar(async () => {
      const fd = new FormData();
      fd.set("launch_id", launchId);
      fd.set("api_key", apiKey);
      try {
        const resultado = await conectarMailerlite(fd);
        if ("error" in resultado) {
          toast.error(resultado.error);
          return;
        }
        setGrupos(resultado.grupos);
        setApiKey("");
        toast.success(conexion.conectado ? "Grupos actualizados" : "MailerLite conectado");
      } catch {
        toast.error("No se pudo conectar con MailerLite");
      }
    });
  }

  const ultimo = conexion.ultimoEnvio;

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span
          className={
            conexion.conectado
              ? "font-medium text-badge-success-text"
              : "font-medium text-badge-warning-text"
          }
        >
          {conexion.conectado ? "Conectado (con firma)" : "Sin conectar"}
        </span>
        <span className="text-text-tertiary">
          {ultimo
            ? `Último envío: ${FECHA_HORA.format(new Date(ultimo.recibido))} · ${
                ultimo.error ?? `${ultimo.guardados} registro(s) guardado(s)`
              }`
            : "Todavía no llegó ningún envío."}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="mailerlite-api-key" className="text-sm font-medium text-input-label-text">
          API key de MailerLite
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="mailerlite-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Pegala acá"
            className="min-w-0 flex-1 basis-64 rounded-lg border border-card-border bg-input-background px-3 py-2 text-sm text-title-50 outline-none duration-300 placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20"
          />
          <Button size="sm" isDisabled={pendiente || apiKey.trim() === ""} onPress={conectar}>
            {conexion.conectado ? "Ver grupos" : "Conectar"}
          </Button>
          {conexion.conectado && (
            <Button size="sm" appearance="outline" isDisabled={pendiente} onPress={desconectar}>
              Desconectar
            </Button>
          )}
        </div>
        <p className="text-xs text-text-tertiary">
          Se usa en este momento para crear el webhook y listar los grupos, y no se guarda. Sale de
          MailerLite → Integraciones → API.
          {conexion.conectado &&
            " Para desconectar: con la key pegada también se borra el webhook en MailerLite; sin ella, deja de recibir y lo borrás a mano."}
        </p>
      </div>

      {grupos && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-text-secondary">
            Grupos de la cuenta ({grupos.length}): copiá el id en la landing que corresponda.
          </p>
          {grupos.length === 0 ? (
            <p className="text-sm text-text-tertiary">La cuenta no tiene grupos.</p>
          ) : (
            <ul className="max-h-56 divide-y divide-card-border overflow-y-auto rounded-lg border border-card-border">
              {grupos.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-text-primary">{g.name}</span>
                  <button
                    type="button"
                    onClick={() => copiar(g.id, "Id del grupo copiado")}
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-text-tertiary hover:text-text-primary [&>svg]:size-3.5"
                  >
                    {g.id}
                    <Copy1 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <details className="text-xs text-text-tertiary">
        <summary className="cursor-pointer">Conexión manual (si creás el webhook a mano)</summary>
        <div className="mt-2 flex flex-col gap-2">
          <p>
            Evento <code>subscriber.added_to_group</code>, apuntando a esta URL. Sin la conexión
            automática no hay verificación de firma: la protege solo el token de la URL.
          </p>
          <button
            type="button"
            onClick={() => copiar(`${window.location.origin}${rutaWebhook}`, "URL del webhook copiada")}
            className="inline-flex items-center gap-1.5 self-start text-primary-500 hover:underline [&>svg]:size-3.5"
          >
            <Copy1 />
            Copiar URL del webhook
          </button>
        </div>
      </details>
    </div>
  );
}

/**
 * Copia el script de visitas de una landing, listo para pegar antes de
 * `</body>`. La clave va a la vista en el HTML de la landing: no es secreta.
 */
export function CopiarScriptVisitas({ trackKey }: { trackKey: string }) {
  async function copiar() {
    const script = `<script async src="${window.location.origin}/t.js" data-k="${trackKey}"></script>`;
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Script copiado: pegalo antes de </body> en la landing");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title="Copiar el script de visitas de esta landing"
      className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:underline [&>svg]:size-3.5"
    >
      <Copy1 />
      Script
    </button>
  );
}

/**
 * Elegir landings ya cargadas como proyectos del cliente: nombre, URL,
 * proyecto conectado y ruta se completan solos. Lo que falte se edita después.
 */
export function ElegirLandings({
  launchId,
  proyectos,
}: {
  launchId: string;
  proyectos: { id: string; name: string; site_url: string | null }[];
}) {
  if (proyectos.length === 0) return null;
  return (
    <DialogoForm titulo="Elegir landings" etiquetaAbrir="Elegir landings" action={agregarLandingsDesdeProyectos}>
      <input type="hidden" name="launch_id" value={launchId} />
      <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
        {proyectos.map((p) => (
          <li key={p.id}>
            <Checkbox name="project_ids" value={p.id} className="w-full rounded-md px-2 py-1.5 hover:bg-base-50">
              <span className="min-w-0">
                <span className="block truncate text-sm text-text-primary">{p.name}</span>
                <span className="block truncate text-xs text-text-tertiary">
                  {p.site_url ? p.site_url.replace(/^https?:\/\//, "") : "sin URL: la ruta se completa a mano"}
                </span>
              </span>
            </Checkbox>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-tertiary">
        Se agregan con su nombre y su URL. Si la URL es del proyecto conectado, visitas y registros
        empiezan a contar solos.
      </p>
    </DialogoForm>
  );
}

/** Campos del diálogo de importación: viven adentro para reiniciarse al cerrar. */
function CamposImportacion({
  launchId,
  paginas,
}: {
  launchId: string;
  paginas: { id: string; name: string; kind: string }[];
}) {
  const [leido, setLeido] = useState<ResultadoImportacion | null>(null);
  const [archivo, setArchivo] = useState<string | null>(null);
  // Se serializa una vez al leer el archivo, no en cada render. Vacío si se
  // pasa del tope: el servidor lo rechazaría igual y así no viaja de más.
  const [payload, setPayload] = useState("");
  const [demasiado, setDemasiado] = useState(false);

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f.name);
    if (f.size > TOPE_ARCHIVO_BYTES) {
      setLeido(null);
      setPayload("");
      setDemasiado(false);
      toast.error("El archivo pesa más de 5 MB: dividilo en partes");
      return;
    }
    const resultado = leerRegistros(await f.text());
    const json =
      resultado.registros.length > 0 && resultado.registros.length <= TOPE_IMPORTACION
        ? JSON.stringify(resultado.registros)
        : "";
    // Con muchas columnas extra el envío pesa más que las filas: también tiene tope.
    const pesado = new Blob([json]).size > TOPE_ENVIO_BYTES;
    setLeido(resultado);
    setDemasiado(pesado);
    setPayload(pesado ? "" : json);
  }

  const nombreColumna = (i: number) => (leido && i >= 0 ? leido.encabezados[i] : null);
  const deRegistro = paginas.filter((p) => p.kind !== "venta");

  return (
    <>
      <input type="hidden" name="launch_id" value={launchId} />
      <input type="hidden" name="registros" value={payload} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-input-label-text">Archivo CSV</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={elegir}
          className="text-sm text-text-secondary file:mr-3 file:rounded-lg file:border file:border-card-border file:bg-input-background file:px-3 file:py-1.5 file:text-sm"
        />
        <span className="text-xs text-text-tertiary">
          Exportalo de la base del cliente (Supabase → Table editor → Export to CSV), de MailerLite o
          de un Google Sheet. Las columnas de email, nombre, teléfono, fecha y utm_source se
          reconocen solas.
        </span>
      </label>

      {leido && (
        <div className="rounded-lg border border-card-border p-3 text-sm">
          {leido.columnas.email < 0 ? (
            <p className="text-badge-error-text">
              {archivo}: no tiene una columna de email. Renombrala a “email” y elegí el archivo de nuevo.
            </p>
          ) : (
            <>
              <p className="font-medium text-text-primary">
                {leido.registros.length.toLocaleString("es-AR")} registros listos para importar
                {leido.registros.length > TOPE_IMPORTACION && (
                  <span className="text-badge-error-text">
                    {" "}
                    (máximo {TOPE_IMPORTACION} por vez: dividí el archivo)
                  </span>
                )}
              </p>
              <ul className="mt-1 text-xs text-text-tertiary">
                <li>
                  Columnas: email = {nombreColumna(leido.columnas.email)}
                  {nombreColumna(leido.columnas.name) && ` · nombre = ${nombreColumna(leido.columnas.name)}`}
                  {nombreColumna(leido.columnas.phone) && ` · teléfono = ${nombreColumna(leido.columnas.phone)}`}
                  {nombreColumna(leido.columnas.registered_at) &&
                    ` · fecha = ${nombreColumna(leido.columnas.registered_at)}`}
                  {nombreColumna(leido.columnas.utm_source) &&
                    ` · fuente = ${nombreColumna(leido.columnas.utm_source)}`}
                </li>
                {leido.extras.length > 0 && (
                  <li>Datos extra que también se guardan: {leido.extras.join(", ")}.</li>
                )}
                {demasiado && (
                  <li className="text-badge-error-text">
                    El archivo tiene demasiados datos para una sola vez: dividilo en partes más chicas.
                  </li>
                )}
                {leido.columnas.registered_at < 0 && (
                  <li className="text-badge-warning-text">
                    Sin columna de fecha: todos quedan con la fecha de hoy y no se ven por día.
                  </li>
                )}
                {leido.descartadas > 0 && <li>{leido.descartadas} filas sin email válido se saltean.</li>}
                {leido.repetidos > 0 && <li>{leido.repetidos} emails repetidos cuentan una sola vez.</li>}
                {leido.sinFecha > 0 && (
                  <li className="text-badge-warning-text">
                    {leido.sinFecha} filas tienen una fecha que no se pudo leer: quedan con la fecha de hoy.
                  </li>
                )}
                <li>Los emails que ya estén en el lanzamiento no se vuelven a contar.</li>
              </ul>
            </>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-input-label-text">Landing</span>
        <Select name="page_id" defaultValue="">
          <option value="">Sin landing (solo suman al total)</option>
          {deRegistro.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <span className="text-xs text-text-tertiary">
          Si el archivo es de una sola landing, elegila: así su conversión queda bien. Reimportar el
          mismo archivo no duplica.
        </span>
      </label>
    </>
  );
}

/** Recupera registros de un lanzamiento que corrió antes de conectar el panel. */
export function ImportarRegistros({
  launchId,
  paginas,
}: {
  launchId: string;
  paginas: { id: string; name: string; kind: string }[];
}) {
  return (
    <DialogoForm titulo="Importar registros" etiquetaAbrir="Importar registros" action={importarRegistros}>
      <CamposImportacion launchId={launchId} paginas={paginas} />
    </DialogoForm>
  );
}
