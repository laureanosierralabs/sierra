"use client";

import { useState } from "react";
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
  ESTADOS_TAREA,
  LABEL_ESTADO_TAREA,
  type EstadoTarea,
  type Miembro,
  type Tarea,
} from "@/lib/landing/tipos";
import { Vencimiento } from "@/components/landing/ui";

function Tarjeta({
  tarea,
  nombreMiembro,
  onAbrir,
}: {
  tarea: Tarea;
  nombreMiembro: Map<string, string>;
  onAbrir: (t: Tarea) => void;
}) {
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
      onClick={() => onAbrir(tarea)}
      className={`cursor-grab rounded-lg border border-line bg-ground p-2.5 transition-colors hover:border-line-strong active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <p className="text-sm font-medium leading-snug">{tarea.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {responsable && (
          <span className="text-[0.6875rem] text-text-3">{responsable}</span>
        )}
        {tarea.due_date && <Vencimiento fecha={tarea.due_date} />}
      </div>
    </div>
  );
}

function Columna({
  estado,
  tareas,
  nombreMiembro,
  onAbrir,
}: {
  estado: EstadoTarea;
  tareas: Tarea[];
  nombreMiembro: Map<string, string>;
  onAbrir: (t: Tarea) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${estado}` });

  return (
    <div className="flex min-w-55 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="eyebrow">{LABEL_ESTADO_TAREA[estado]}</h3>
        <span className="tnum text-xs text-text-3">{tareas.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-30 flex-col gap-2 rounded-xl border border-line p-2 transition-colors ${
          isOver ? "bg-surface-2" : "bg-surface"
        }`}
      >
        <SortableContext
          items={tareas.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tareas.map((t) => (
            <Tarjeta
              key={t.id}
              tarea={t}
              nombreMiembro={nombreMiembro}
              onAbrir={onAbrir}
            />
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
  onAbrir,
}: {
  tareas: Tarea[];
  miembros: Miembro[];
  projectId: string;
  onAbrir: (t: Tarea) => void;
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
  const porEstado = (e: EstadoTarea) => items.filter((t) => t.status === e);

  function estadoDe(id: string): EstadoTarea | null {
    if (id.startsWith("col-")) return id.slice(4) as EstadoTarea;
    return items.find((t) => t.id === id)?.status ?? null;
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;

    const origen = estadoDe(String(active.id));
    const destino = estadoDe(String(over.id));
    if (!origen || !destino) return;

    const tarea = items.find((t) => t.id === active.id);
    if (!tarea) return;

    let siguiente = items;

    if (origen === destino) {
      const enColumna = porEstado(destino);
      const desde = enColumna.findIndex((t) => t.id === active.id);
      const hasta = enColumna.findIndex((t) => t.id === over.id);
      if (desde === -1 || hasta === -1 || desde === hasta) return;

      const reordenada = arrayMove(enColumna, desde, hasta);
      siguiente = items.map(
        (t) => reordenada.find((r) => r.id === t.id) ?? t,
      );
      const ids = reordenada.map((t) => t.id);
      setItems(
        siguiente.sort(
          (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id) || 0,
        ),
      );
      void moverTarea(String(active.id), destino, ids, projectId);
      return;
    }

    siguiente = items.map((t) =>
      t.id === active.id ? { ...t, status: destino } : t,
    );
    setItems(siguiente);

    const ids = siguiente.filter((t) => t.status === destino).map((t) => t.id);
    void moverTarea(String(active.id), destino, ids, projectId);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ESTADOS_TAREA.map((e) => (
          <Columna
            key={e}
            estado={e}
            tareas={porEstado(e)}
            nombreMiembro={nombreMiembro}
            onAbrir={onAbrir}
          />
        ))}
      </div>
    </DndContext>
  );
}
