"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
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

  const responsable = tarea.assigned_to
    ? nombreMiembro.get(tarea.assigned_to)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/landing-pages/tasks/${tarea.id}`)}
      className={`cursor-grab rounded-lg border border-line bg-ground p-2.5 transition-colors hover:border-line-strong active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <p className="text-sm font-medium leading-snug">{tarea.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* El estado real sigue visible aunque la columna agrupe */}
        {(tarea.status === "en-revision" || tarea.status === "bloqueada") && (
          <span
            className={`rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${
              tarea.status === "bloqueada"
                ? "bg-critical-dim text-critical"
                : "bg-warn-dim text-warn"
            }`}
          >
            {LABEL_ESTADO_TAREA[tarea.status]}
          </span>
        )}
        {responsable && (
          <span className="text-[0.6875rem] text-text-3">{responsable}</span>
        )}
        {tarea.due_date && (
          <Vencimiento
            fecha={tarea.due_date}
            cerrado={tarea.status === "completada"}
          />
        )}
      </div>
    </div>
  );
}

function Columna({
  id,
  label,
  fondo,
  punto,
  tareas,
  nombreMiembro,
}: {
  id: ColumnaKanban;
  label: string;
  fondo: string;
  punto: string;
  tareas: Tarea[];
  nombreMiembro: Map<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}` });

  return (
    <div className="flex min-w-55 flex-1 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={`size-1.5 rounded-full ${punto}`} />
        <h3 className="eyebrow">{label}</h3>
        <span className="tnum ml-auto text-xs text-text-3">
          {tareas.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-30 flex-col gap-2 rounded-xl border border-line p-2 transition-colors ${
          isOver ? "bg-surface-2" : fondo
        }`}
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
          <p className="px-1 py-3 text-xs text-text-3">Sin tareas</p>
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

  function columnaObjetivo(id: string): ColumnaKanban | null {
    if (id.startsWith("col-")) return id.slice(4) as ColumnaKanban;
    const t = items.find((x) => x.id === id);
    return t ? columnaDe(t.status) : null;
  }

  function onDragEnd(e: DragEndEvent) {
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
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNAS_KANBAN.map((c) => (
          <Columna
            key={c.id}
            id={c.id}
            label={c.label}
            fondo={c.fondo}
            punto={c.punto}
            tareas={enColumna(c.id)}
            nombreMiembro={nombreMiembro}
          />
        ))}
      </div>
    </DndContext>
  );
}
