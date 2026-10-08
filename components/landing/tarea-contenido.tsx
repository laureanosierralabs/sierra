import Link from "next/link";
import {
  Bookmark1,
  CalendarTime,
  CheckCircle1,
  Folder1,
  Paperclip2,
  User2,
} from "@tailgrids/icons";
import { plantillaDe } from "@/lib/landing/plantillas";
import { Prioridad, SeccionTitulo, Vencimiento } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { FormularioTarea } from "@/components/landing/formulario-tarea";
import { Adjuntos } from "@/components/landing/adjuntos";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";
import type { Adjunto, Miembro, Proyecto, Tarea } from "@/lib/landing/tipos";

type IconoComponent = React.ComponentType<{ className?: string }>;

function Propiedad({
  icono: Icono,
  label,
  children,
}: {
  icono: IconoComponent;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex w-28 shrink-0 items-center gap-2 text-xs text-text-tertiary">
        <Icono className="size-4" />
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
  adjuntos,
  columnas = 2,
}: {
  tarea: Tarea;
  proyecto: Proyecto | null;
  miembros: Miembro[];
  adjuntos: Adjunto[];
  columnas?: 1 | 2;
}) {
  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const responsable =
    tarea.assignee_ids
      .map((id) => nombreMiembro.get(id))
      .filter((n): n is string => Boolean(n))
      .join(", ") || null;

  const plantilla = plantillaDe(tarea.template);

  return (
    <>
      <Card
        className={cn("mb-6 grid gap-x-10 px-4 py-3", columnas === 2 && "md:grid-cols-2")}
      >
        <Propiedad icono={CheckCircle1} label="Estado">
          <EstadoSelect id={tarea.id} valor={tarea.status} tipo="tarea" />
        </Propiedad>

        <Propiedad icono={Folder1} label="Proyecto">
          {proyecto ? (
            <Link
              href={`/landing-pages/projects/${proyecto.id}`}
              className="truncate text-sm font-medium text-text-primary hover:underline"
            >
              {proyecto.name}
            </Link>
          ) : (
            <p className="text-sm text-text-tertiary">—</p>
          )}
        </Propiedad>

        <Propiedad icono={User2} label="Responsable">
          <p className="truncate text-sm text-text-primary">{responsable ?? "—"}</p>
        </Propiedad>

        <Propiedad icono={Bookmark1} label="Prioridad">
          <Prioridad prioridad={tarea.priority} />
        </Propiedad>

        <Propiedad icono={CalendarTime} label="Deadline">
          <Vencimiento fecha={tarea.due_date} cerrado={tarea.status === "completada"} />
        </Propiedad>
      </Card>

      {tarea.description && (
        <Card className="mb-6 p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
            {tarea.description}
          </p>
        </Card>
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

      <section className="mt-6">
        <SeccionTitulo icono={Paperclip2}>Adjuntos</SeccionTitulo>
        <Adjuntos taskId={tarea.id} adjuntos={adjuntos} />
      </section>
    </>
  );
}
