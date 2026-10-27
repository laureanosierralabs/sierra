"use client";

import dynamic from "next/dynamic";

/** dnd-kit se baja aparte; el placeholder reserva un alto mínimo para el tablero. */
export const Kanban = dynamic(
  () => import("@/components/landing/kanban-completo").then((m) => m.KanbanCompleto),
  {
    loading: () => (
      <div aria-hidden="true" className="min-h-64 w-full animate-pulse rounded-xl bg-card-border/20" />
    ),
  },
);
