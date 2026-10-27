"use client";

import dynamic from "next/dynamic";

/** FullCalendar pesa mucho: se baja aparte, con el alto del calendario reservado. */
export const Calendario = dynamic(
  () => import("@/components/landing/calendario-completo").then((m) => m.CalendarioCompleto),
  {
    loading: () => (
      <div aria-hidden="true" className="h-150 w-full animate-pulse rounded-xl bg-card-border/20" />
    ),
  },
);
