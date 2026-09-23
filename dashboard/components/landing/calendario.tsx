"use client";

import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TareaForm } from "@/components/landing/tarea-form";
import type { Miembro, Proyecto, Tarea } from "@/lib/landing/tipos";

type Vista = "timeGridWeek" | "dayGridMonth";

const BOTON =
  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-2";

export function Calendario({
  tareas,
  proyectos,
  miembros,
}: {
  tareas: Tarea[];
  proyectos: Proyecto[];
  miembros: Miembro[];
}) {
  const ref = useRef<FullCalendar>(null);
  const [vista, setVista] = useState<Vista>("timeGridWeek");
  const [titulo, setTitulo] = useState("");
  const [editando, setEditando] = useState<Tarea | null>(null);

  const nombreProyecto = new Map(proyectos.map((p) => [p.id, p.name]));
  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));

  const eventos: EventInput[] = [
    ...tareas
      .filter((t) => t.due_date)
      .map((t) => ({
        id: t.id,
        title: t.title,
        start: t.due_date!,
        allDay: true,
        extendedProps: {
          tipo: "tarea" as const,
          detalle: [
            t.project_id ? nombreProyecto.get(t.project_id) : null,
            t.assigned_to ? nombreMiembro.get(t.assigned_to) : null,
          ]
            .filter(Boolean)
            .join(" · "),
          completada: t.status === "completada",
        },
      })),
    ...proyectos
      .filter((p) => p.due_date && p.status !== "entregado")
      .map((p) => ({
        id: `proyecto-${p.id}`,
        title: p.name,
        start: p.due_date!,
        allDay: true,
        extendedProps: {
          tipo: "proyecto" as const,
          detalle: "Entrega",
          completada: false,
        },
      })),
  ];

  function api() {
    return ref.current?.getApi();
  }

  function cambiarVista(v: Vista) {
    setVista(v);
    api()?.changeView(v);
  }

  function onEventClick(arg: EventClickArg) {
    if (arg.event.extendedProps.tipo !== "tarea") return;
    const tarea = tareas.find((t) => t.id === arg.event.id);
    if (tarea) setEditando(tarea);
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => api()?.prev()}
            className="rounded-md p-1 text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => api()?.next()}
            className="rounded-md p-1 text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => api()?.today()}
            className={`${BOTON} ml-1 border border-line text-text-2`}
          >
            Hoy
          </button>
          <h2 className="ml-2 font-display text-sm font-bold capitalize">
            {titulo}
          </h2>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
          <button
            type="button"
            onClick={() => cambiarVista("timeGridWeek")}
            className={`${BOTON} ${vista === "timeGridWeek" ? "bg-surface-2 text-text" : "text-text-2"}`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => cambiarVista("dayGridMonth")}
            className={`${BOTON} ${vista === "dayGridMonth" ? "bg-surface-2 text-text" : "text-text-2"}`}
          >
            Mes
          </button>
        </div>
      </div>

      <div className="calendario overflow-hidden rounded-xl border border-line bg-surface">
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          headerToolbar={false}
          height={560}
          allDaySlot
          allDayText="Vence"
          nowIndicator
          dayMaxEvents={3}
          firstDay={1}
          events={eventos}
          eventClick={onEventClick}
          datesSet={(arg) => setTitulo(arg.view.title)}
          eventContent={(arg) => {
            const { tipo, detalle, completada } = arg.event.extendedProps;
            return (
              <div
                className={`flex min-w-0 items-center gap-1.5 px-1 py-0.5 text-[0.6875rem] leading-tight ${
                  completada ? "opacity-50" : ""
                }`}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    tipo === "proyecto" ? "bg-warn" : "bg-idle"
                  }`}
                />
                <span className="truncate font-medium">{arg.event.title}</span>
                {detalle && (
                  <span className="truncate text-text-3">{detalle}</span>
                )}
              </div>
            );
          }}
        />
      </div>

      {editando && (
        <TareaForm
          miembros={miembros}
          proyectos={proyectos}
          tarea={editando}
          abiertoExterno
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  );
}
