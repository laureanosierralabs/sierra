"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { moverTarea } from "@/app/landing-pages/acciones";
import {
  COLUMNAS_KANBAN,
  LABEL_ESTADO_TAREA,
  columnaDe,
  type ColumnaKanban,
  type EstadoTarea,
  type Miembro,
  type Tarea,
} from "@/lib/landing/tipos";
import { Vencimiento } from "@/components/landing/ui";
import { Badge } from "@/components/tailgrids/core/badge";
import { cn } from "@/utils/cn";

/* Tono de cada columna (fondo teñido y punto), con los tokens del template.
   Los de COLUMNAS_KANBAN en lib/ siguen siendo los tokens viejos. */
const TONO_COLUMNA: Record<ColumnaKanban, { fondo: string; punto: string }> = {
  pendiente: { fondo: "bg-badge-blue-background/30", punto: "bg-badge-blue-icon-color" },
  "en-progreso": { fondo: "bg-badge-warning-background/30", punto: "bg-badge-warning-icon-color" },
  completada: { fondo: "bg-badge-success-background/30", punto: "bg-badge-success-icon-color" },
};

/** Contenido visual, sin lógica de arrastre: lo reusa el DragOverlay. */
function ContenidoTarjeta({
  tarea,
  nombreMiembro,
}: {
  tarea: Tarea;
  nombreMiembro: Map<string, string>;
}) {
  const responsables = tarea.assignee_ids
    .map((id) => nombreMiembro.get(id))
    .filter((n): n is string => Boolean(n))
    .join(", ");

  return (
    <>
      <p className="text-sm leading-snug font-medium text-text-primary">{tarea.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* El estado real sigue visible aunque la columna agrupe */}
        {(tarea.status === "en-revision" || tarea.status === "bloqueada") && (
          <Badge
            color={tarea.status === "bloqueada" ? "error" : "warning"}
            size="sm"
            className="rounded-md text-[0.625rem] font-semibold tracking-wide uppercase"
          >
            {LABEL_ESTADO_TAREA[tarea.status]}
          </Badge>
        )}
        {responsables && (
          <span className="text-[0.6875rem] text-text-tertiary">{responsables}</span>
        )}
        {tarea.due_date && (
          <Vencimiento
            fecha={tarea.due_date}
            cerrado={tarea.status === "completada"}
          />
        )}
      </div>
    </>
  );
}

function Tarjeta({
  tarea,
  nombreMiembro,
}: {
  tarea: Tarea;
  nombreMiembro: Map<string, string>;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarea.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      // No KeyboardSensor: don't announce a keyboard-sortable item ("sortable").
      aria-roledescription="tarea"
      {...listeners}
      onClick={() => router.push(`/landing-pages/tasks/${tarea.id}`)}
      onKeyDown={(e) => {
        // Sin KeyboardSensor, Enter abre la tarea (el arrastre es solo con puntero).
        if (e.key === "Enter" && e.target === e.currentTarget) {
          router.push(`/landing-pages/tasks/${tarea.id}`);
        }
      }}
      className={cn(
        "cursor-grab rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500 border-[0.5px] border-card-border bg-card-background p-2.5 shadow-sm transition-[border-color,box-shadow] hover:border-primary-300 hover:shadow-md active:cursor-grabbing",
        // El hueco queda marcado pero apagado: se ve de dónde salió la tarjeta.
        isDragging && "opacity-30",
      )}
    >
      <ContenidoTarjeta tarea={tarea} nombreMiembro={nombreMiembro} />
    </div>
  );
}

function Columna({
  id,
  label,
  tareas,
  nombreMiembro,
}: {
  id: ColumnaKanban;
  label: string;
  tareas: Tarea[];
  nombreMiembro: Map<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}` });
  const { fondo, punto } = TONO_COLUMNA[id];

  return (
    <div className="flex min-w-55 flex-1 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", punto)} />
        <h3 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">{label}</h3>
        <span className="ml-auto text-xs tabular-nums text-text-tertiary">
          {tareas.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-30 flex-col gap-2 rounded-xl border p-2 transition-all duration-150",
          isOver
            ? "border-dashed border-primary-300 bg-background-gray-secondary ring-2 ring-primary-300/20"
            : cn("border-card-border", fondo),
        )}
      >
        <SortableContext
          items={tareas.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tareas.map((t) => (
            <Tarjeta key={t.id} tarea={t} nombreMiembro={nombreMiembro} />
          ))}
        </SortableContext>

        {tareas.length === 0 && (
          <p className="px-1 py-3 text-xs text-text-tertiary">Sin tareas</p>
        )}
      </div>
    </div>
  );
}

export function Kanban({
  tareas,
  miembros,
  projectId,
}: {
  tareas: Tarea[];
  miembros: Miembro[];
  projectId: string;
}) {
  // Copia local para que el arrastre se vea inmediato; el servidor confirma
  // después. Se resincroniza durante el render (no en un efecto) cuando el
  // servidor manda datos nuevos.
  const [items, setItems] = useState(tareas);
  const [vistas, setVistas] = useState(tareas);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  if (vistas !== tareas) {
    setVistas(tareas);
    setItems(tareas);
  }

  const sensors = useSensors(
    // Sin esta distancia, un click para abrir la tarea se interpreta como drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const enColumna = (c: ColumnaKanban) =>
    items.filter((t) => columnaDe(t.status) === c);
  const arrastrandoTarea = arrastrando
    ? items.find((t) => t.id === arrastrando)
    : null;

  function columnaObjetivo(id: string): ColumnaKanban | null {
    if (id.startsWith("col-")) return id.slice(4) as ColumnaKanban;
    const t = items.find((x) => x.id === id);
    return t ? columnaDe(t.status) : null;
  }

  const tituloDe = (id: string | number) =>
    `«${items.find((t) => t.id === String(id))?.title ?? "tarea"}»`;
  const labelColumna = (id: string | number) => {
    const col = columnaObjetivo(String(id));
    return COLUMNAS_KANBAN.find((c) => c.id === col)?.label ?? "otra columna";
  };

  function onDragStart(e: DragStartEvent) {
    setArrastrando(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setArrastrando(null);
    const { active, over } = e;
    if (!over) return;

    const tarea = items.find((t) => t.id === active.id);
    if (!tarea) return;

    const origen = columnaDe(tarea.status);
    const destino = columnaObjetivo(String(over.id));
    if (!destino) return;

    if (origen === destino) {
      const lista = enColumna(destino);
      const desde = lista.findIndex((t) => t.id === active.id);
      const hasta = lista.findIndex((t) => t.id === over.id);
      if (desde === -1 || hasta === -1 || desde === hasta) return;

      const ids = arrayMove(lista, desde, hasta).map((t) => t.id);
      setItems(
        [...items].sort((a, b) => {
          const ia = ids.indexOf(a.id);
          const ib = ids.indexOf(b.id);
          return ia === -1 || ib === -1 ? 0 : ia - ib;
        }),
      );
      // Reordenar dentro de la misma columna no cambia el estado: una tarea
      // bloqueada sigue bloqueada.
      void moverTarea(String(active.id), tarea.status, ids, projectId);
      return;
    }

    const nuevoEstado = destino as EstadoTarea;
    const siguiente = items.map((t) =>
      t.id === active.id ? { ...t, status: nuevoEstado } : t,
    );
    setItems(siguiente);

    const ids = siguiente
      .filter((t) => columnaDe(t.status) === destino)
      .map((t) => t.id);
    void moverTarea(String(active.id), nuevoEstado, ids, projectId);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        screenReaderInstructions: { draggable: "Presiona Enter para abrir la tarea." },
        announcements: {
          onDragStart: ({ active }) => `Tomaste ${tituloDe(active.id)}.`,
          onDragOver: ({ active, over }) =>
            over ? `${tituloDe(active.id)} está sobre ${labelColumna(over.id)}.` : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `Soltaste ${tituloDe(active.id)} en ${labelColumna(over.id)}.`
              : `Soltaste ${tituloDe(active.id)} fuera de una columna.`,
          onDragCancel: ({ active }) => `Se canceló el movimiento de ${tituloDe(active.id)}.`,
        },
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setArrastrando(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNAS_KANBAN.map((c) => (
          <Columna
            key={c.id}
            id={c.id}
            label={c.label}
            tareas={enColumna(c.id)}
            nombreMiembro={nombreMiembro}
          />
        ))}
      </div>

      {/* La tarjeta viaja elevada y rotada: se siente levantada del plano,
          que es lo que vuelve legible hacia dónde la estás llevando. */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {arrastrandoTarea && (
          <div className="rotate-2 cursor-grabbing rounded-lg border border-primary-300 bg-card-background p-2.5 shadow-lg">
            <ContenidoTarjeta
              tarea={arrastrandoTarea}
              nombreMiembro={nombreMiembro}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
