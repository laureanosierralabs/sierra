"use client";

import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "@tailgrids/icons";
import { Card } from "@/components/tailgrids/core/card";
import { Button } from "@/components/tailgrids/core/button";
import type { Miembro, Proyecto, Tarea } from "@/lib/landing/tipos";

type Vista = "timeGridWeek" | "dayGridMonth";
type EstadoVencimiento = "cerrado" | "vencido" | "urgente" | "normal";

/** El `end` de un evento de día completo es exclusivo: hay que correrlo uno. */
function sumarUnDia(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Mismo umbral que el componente Vencimiento: cerrado no alarma, ≤7 días urge. */
function estadoVencimiento(
  fecha: string | null,
  cerrado: boolean,
): EstadoVencimiento {
  if (cerrado) return "cerrado";
  if (!fecha) return "normal";

  const objetivo = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(objetivo.getTime())) return "normal";

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);

  if (dias < 0) return "vencido";
  if (dias <= 7) return "urgente";
  return "normal";
}

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
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("timeGridWeek");
  const [titulo, setTitulo] = useState("");

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
            t.assignee_ids.map((id) => nombreMiembro.get(id)).filter(Boolean).join(", ") ||
              null,
          ]
            .filter(Boolean)
            .join(" · "),
          completada: t.status === "completada",
          vencimiento: estadoVencimiento(t.due_date, t.status === "completada"),
        },
      })),
    // Con las dos fechas el proyecto se dibuja como una barra que abarca lo
    // que dura; con una sola queda como un punto suelto, igual que antes.
    ...proyectos
      .filter((p) => (p.start_date || p.due_date) && p.status !== "entregado")
      .map((p) => {
        const desde = p.start_date ?? p.due_date!;
        const rango = Boolean(p.start_date && p.due_date);

        return {
          id: `proyecto-${p.id}`,
          title: p.name,
          start: desde,
          // FullCalendar trata `end` como exclusivo en eventos de día
          // completo: sin el +1 la barra cortaría un día antes.
          ...(rango ? { end: sumarUnDia(p.due_date!) } : {}),
          allDay: true,
          extendedProps: {
            tipo: "proyecto" as const,
            detalle: rango ? "En curso" : "Entrega",
            completada: false,
            vencimiento: estadoVencimiento(p.due_date, false),
          },
        };
      }),
  ];

  function api() {
    return ref.current?.getApi();
  }

  function cambiarVista(v: Vista) {
    setVista(v);
    api()?.changeView(v);
  }

  function onEventClick(arg: EventClickArg) {
    const { tipo } = arg.event.extendedProps;
    if (tipo === "tarea") {
      router.push(`/landing-pages/tasks/${arg.event.id}`);
      return;
    }
    // Los eventos de proyecto llevan el id prefijado para no chocar con tareas.
    router.push(
      `/landing-pages/projects/${String(arg.event.id).replace(/^proyecto-/, "")}`,
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            appearance="outline"
            size="xs"
            iconOnly
            aria-label="Anterior"
            onPress={() => api()?.prev()}
          >
            <ChevronLeft />
          </Button>
          <Button
            appearance="outline"
            size="xs"
            iconOnly
            aria-label="Siguiente"
            onPress={() => api()?.next()}
          >
            <ChevronRight />
          </Button>
          <Button appearance="outline" size="xs" onPress={() => api()?.today()}>
            Hoy
          </Button>
          <h2 className="ml-2 text-sm font-semibold text-title-50 capitalize">{titulo}</h2>
        </div>

        <div role="group" aria-label="Vista del calendario" className="flex items-center gap-1.5">
          <Button
            size="xs"
            appearance={vista === "timeGridWeek" ? "fill" : "outline"}
            aria-pressed={vista === "timeGridWeek"}
            onPress={() => cambiarVista("timeGridWeek")}
          >
            Semana
          </Button>
          <Button
            size="xs"
            appearance={vista === "dayGridMonth" ? "fill" : "outline"}
            aria-pressed={vista === "dayGridMonth"}
            onPress={() => cambiarVista("dayGridMonth")}
          >
            Mes
          </Button>
        </div>
      </div>

      <Card className="calendario overflow-hidden p-0">
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
            const { tipo, detalle, completada, vencimiento } =
              arg.event.extendedProps as {
                tipo: "tarea" | "proyecto";
                detalle: string;
                completada: boolean;
                vencimiento: EstadoVencimiento;
              };
            return (
              <div
                className={`flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-[0.6875rem] leading-tight ${
                  completada ? "opacity-50" : ""
                } ${
                  vencimiento === "vencido"
                    ? "bg-badge-error-background"
                    : vencimiento === "urgente"
                      ? "bg-badge-warning-background"
                      : ""
                }`}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    tipo === "proyecto" ? "bg-warning-500" : "bg-primary-500"
                  }`}
                />
                <span className="truncate font-medium">{arg.event.title}</span>
                {detalle && (
                  <span className="truncate text-text-tertiary">{detalle}</span>
                )}
              </div>
            );
          }}
        />
      </Card>
    </div>
  );
}
