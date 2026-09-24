import Link from "next/link";
import {
  CalendarClock,
  CircleDashed,
  Flag,
  FolderKanban,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { plantillaDe } from "@/lib/landing/plantillas";
import { Prioridad, Vencimiento } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { FormularioTarea } from "@/components/landing/formulario-tarea";
import type { Miembro, Proyecto, Tarea } from "@/lib/landing/tipos";

function Propiedad({
  icono: Icono,
  label,
  children,
}: {
  icono: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex w-28 shrink-0 items-center gap-2 text-xs text-text-3">
        <Icono className="size-3.5" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Cuerpo de la tarea. Lo comparten la página completa y el panel lateral,
 * así no hay dos versiones que se desincronicen.
 */
export function TareaContenido({
  tarea,
  proyecto,
  miembros,
  columnas = 2,
}: {
  tarea: Tarea;
  proyecto: Proyecto | null;
  miembros: Miembro[];
  columnas?: 1 | 2;
}) {
  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const responsable = tarea.assigned_to
    ? (nombreMiembro.get(tarea.assigned_to) ?? null)
    : null;

  const plantilla = plantillaDe(tarea.template);

  return (
    <>
      <div
        className={`mb-6 grid gap-x-10 rounded-xl border border-line bg-surface px-4 py-3 ${
          columnas === 2 ? "md:grid-cols-2" : ""
        }`}
      >
        <Propiedad icono={CircleDashed} label="Estado">
          <EstadoSelect id={tarea.id} valor={tarea.status} tipo="tarea" />
        </Propiedad>

        <Propiedad icono={FolderKanban} label="Proyecto">
          {proyecto ? (
            <Link
              href={`/landing-pages/projects/${proyecto.id}`}
              className="truncate text-sm font-medium hover:underline"
            >
              {proyecto.name}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </Propiedad>

        <Propiedad icono={UserRound} label="Responsable">
          <p className="truncate text-sm">{responsable ?? "—"}</p>
        </Propiedad>

        <Propiedad icono={Flag} label="Prioridad">
          <Prioridad prioridad={tarea.priority} />
        </Propiedad>

        <Propiedad icono={CalendarClock} label="Deadline">
          <Vencimiento fecha={tarea.due_date} />
        </Propiedad>
      </div>

      {tarea.description && (
        <p className="mb-6 whitespace-pre-wrap rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-text-2">
          {tarea.description}
        </p>
      )}

      {/* Los pasos vienen del SOP; la plantilla agrega campos de formulario. */}
      {(plantilla || tarea.steps?.length > 0) && (
        <FormularioTarea
          taskId={tarea.id}
          plantilla={plantilla}
          pasos={tarea.steps ?? []}
          contenido={tarea.content ?? {}}
          columnas={columnas}
        />
      )}
    </>
  );
}
