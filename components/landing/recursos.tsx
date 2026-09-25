"use client";

import { useState } from "react";
import {
  Cloud,
  ExternalLink,
  FileText,
  Frame,
  Folder,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Link as LinkIcon,
  Megaphone,
  Palette,
  Pencil,
  Server,
  type LucideIcon,
} from "lucide-react";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { SeccionTitulo } from "@/components/landing/ui";
import { Copiar, Credencial } from "@/components/landing/credencial";
import type { RecursoVista } from "@/lib/landing/datos";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import {
  borrarRecurso,
  borrarRecursoCliente,
  guardarRecurso,
  guardarRecursoCliente,
} from "@/app/landing-pages/acciones";
import {
  TIPOS_RECURSO,
  LABEL_TIPO_RECURSO,
  type TipoRecurso,
} from "@/lib/landing/tipos";

const POR_TIPO: Record<TipoRecurso, LucideIcon> = {
  archivo: Folder,
  diseno: Palette,
  infraestructura: Server,
  marketing: Megaphone,
  acceso: KeyRound,
  otro: LinkIcon,
};

/** Servicios que se reconocen por dominio; el resto cae al ícono del tipo. */
const POR_DOMINIO: [RegExp, LucideIcon][] = [
  [/figma\.com/i, Frame],
  [/drive\.google\.com|docs\.google\.com/i, Folder],
  [/cloudflare\.com/i, Cloud],
  [/wordpress|wp-admin/i, Globe],
  [/notion\.so/i, FileText],
  [/unsplash|cloudinary|imgur/i, ImageIcon],
];

function iconoDe(recurso: RecursoVista): LucideIcon {
  if (recurso.url) {
    const match = POR_DOMINIO.find(([re]) => re.test(recurso.url!));
    if (match) return match[1];
  }
  return POR_TIPO[recurso.kind] ?? LinkIcon;
}

function RecursoForm({
  duenoId,
  tabla,
  recurso,
}: {
  duenoId: string;
  tabla: "project" | "client";
  recurso?: RecursoVista;
}) {
  const editar = Boolean(recurso);
  const esCliente = tabla === "client";

  return (
    <DialogoForm
      titulo={editar ? "Editar recurso" : "Nuevo recurso"}
      etiquetaAbrir={esCliente ? "Nuevo acceso" : "Nuevo recurso"}
      action={esCliente ? guardarRecursoCliente : guardarRecurso}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      <input
        type="hidden"
        name={esCliente ? "client_id" : "project_id"}
        value={duenoId}
      />
      {recurso && <input type="hidden" name="id" value={recurso.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Nombre">
          <Input name="name" required defaultValue={recurso?.name ?? ""} />
        </Campo>

        <Campo label="Tipo">
          <Select name="kind" defaultValue={recurso?.kind ?? "otro"}>
            {TIPOS_RECURSO.map((k) => (
              <option key={k} value={k}>
                {LABEL_TIPO_RECURSO[k]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="URL">
        <Input
          name="url"
          placeholder="https://…"
          defaultValue={recurso?.url ?? ""}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Usuario / email">
          <Input name="username" defaultValue={recurso?.username ?? ""} />
        </Campo>

        <Campo label="Contraseña">
          <Input
            type="password"
            name="secret"
            autoComplete="new-password"
            placeholder={
              recurso?.tieneSecreto ? "Guardada — dejar vacío" : "Opcional"
            }
          />
        </Campo>
      </div>

      {recurso?.tieneSecreto && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-3">
          <input type="checkbox" name="borrar_secreto" className="size-3.5" />
          Borrar la contraseña guardada
        </label>
      )}

      <Campo label="Notas">
        <Textarea name="notes" rows={2} defaultValue={recurso?.notes ?? ""} />
      </Campo>
    </DialogoForm>
  );
}

export function Recursos({
  duenoId,
  tabla = "project",
  titulo = "Recursos del proyecto",
  recursos,
}: {
  duenoId: string;
  tabla?: "project" | "client";
  titulo?: string;
  recursos: RecursoVista[];
}) {
  const [filtro, setFiltro] = useState<TipoRecurso | "todos">("todos");

  // Filtrar por tipo es lo que categoriza de verdad: las credenciales son un
  // atributo del recurso, no una categoría aparte.
  const presentes = TIPOS_RECURSO.filter((k) =>
    recursos.some((r) => r.kind === k),
  );
  const visibles =
    filtro === "todos" ? recursos : recursos.filter((r) => r.kind === filtro);

  const CHIP = "rounded-md px-2.5 py-1 text-xs font-medium transition-colors";

  return (
    <section>
      <SeccionTitulo
        icono={LinkIcon}
        accion={<RecursoForm duenoId={duenoId} tabla={tabla} />}
      >
        {titulo}
      </SeccionTitulo>

      {presentes.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`${CHIP} ${filtro === "todos" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
          >
            Todo <span className="tnum text-text-3">{recursos.length}</span>
          </button>
          {presentes.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltro(k)}
              className={`${CHIP} ${filtro === k ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
            >
              {LABEL_TIPO_RECURSO[k]}{" "}
              <span className="tnum text-text-3">
                {recursos.filter((r) => r.kind === k).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {visibles.length === 0 && (
          <p className="px-4 py-6 text-sm text-text-3">
            Sin recursos cargados.
          </p>
        )}
        {visibles.map((r) => {
          const Icono = iconoDe(r);
          return (
          <div key={r.id}>
          <div className="group flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-surface-2">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-2">
                <Icono className="size-3.5" />
              </span>

              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <span className="truncate">{r.name}</span>
                  <ExternalLink className="size-3 shrink-0 text-text-3" />
                </a>
              ) : (
                <span className="truncate text-sm font-medium">{r.name}</span>
              )}
              <span className="shrink-0 text-[0.6875rem] text-text-3">
                {LABEL_TIPO_RECURSO[r.kind]}
              </span>
              {(r.username || r.tieneSecreto) && (
                <KeyRound
                  className="size-3 shrink-0 text-text-3"
                  aria-label="Tiene credenciales"
                />
              )}
            </span>

            <span className="flex shrink-0 items-center gap-3">
              {r.notes && (
                <span className="hidden max-w-55 truncate text-xs text-text-3 md:block">
                  {r.notes}
                </span>
              )}
              <RecursoForm duenoId={duenoId} tabla={tabla} recurso={r} />
              <BorrarBoton
                etiqueta="Borrar recurso"
                onConfirmar={() =>
                  tabla === "client"
                    ? borrarRecursoCliente(r.id, duenoId)
                    : borrarRecurso(r.id, duenoId)
                }
              />
            </span>
          </div>

          {(r.username || r.tieneSecreto) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-line bg-surface-2/40 px-3 py-2 pl-12">
              {r.username && (
                <span className="flex items-center gap-2">
                  <span className="text-[0.6875rem] text-text-3">Usuario</span>
                  <span className="truncate font-mono text-sm">
                    {r.username}
                  </span>
                  <Copiar texto={r.username} />
                </span>
              )}
              {r.tieneSecreto && (
                <span className="flex items-center gap-2">
                  <span className="text-[0.6875rem] text-text-3">
                    Contraseña
                  </span>
                  <Credencial recursoId={r.id} tabla={tabla} />
                </span>
              )}
            </div>
          )}
          </div>
          );
        })}
      </div>
    </section>
  );
}
