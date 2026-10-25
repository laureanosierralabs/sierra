"use client";

import { useMemo, useState } from "react";
import { Download1 } from "@tailgrids/icons";
import { descargar } from "@/components/lanzamientos/exportar-registros";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { slugify } from "@/lib/escritura";
import { ingresosWebinar, type EventoWebinar } from "@/lib/lanzamientos/despues";
import type { Registro } from "@/lib/lanzamientos/tipos";
import { csvIngresosWebinar, fechaHora } from "@/lib/lanzamientos/vista";
import { cn } from "@/utils/cn";

type Filtro = "todas" | "registradas" | "nuevas";

const numero = (n: number) => n.toLocaleString("es-AR");
const VISIBLES = 50;

/**
 * Quién entró al webinar con el link personal, persona por persona. Marca si
 * ya estaba registrada o si es nueva (link reenviado u otro email), y deja
 * descargar la lista. `registros` tiene que ser el lanzamiento completo: el
 * estado no cambia con los filtros de período o landing.
 */
export function IngresosWebinar({
  registros,
  webinar,
  lanzamiento,
}: {
  registros: Registro[];
  webinar: EventoWebinar[];
  lanzamiento: string;
}) {
  const datos = useMemo(() => ingresosWebinar(registros, webinar), [registros, webinar]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [todas, setTodas] = useState(false);

  if (datos.personas === 0) return null;

  const filas = datos.filas.filter((f) => (filtro === "todas" ? true : filtro === "registradas" ? f.registrada : !f.registrada));
  const visibles = todas ? filas : filas.slice(0, VISIBLES);
  const opciones: { valor: Filtro; etiqueta: string; cantidad: number }[] = [
    { valor: "todas", etiqueta: "Todas", cantidad: datos.personas },
    { valor: "registradas", etiqueta: "Registradas", cantidad: datos.registradas },
    { valor: "nuevas", etiqueta: "Nuevas", cantidad: datos.nuevas },
  ];

  return (
    <Card className="flex flex-col gap-0 p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Ingresos al webinar</h3>
          <p className="mt-1 text-sm text-text-secondary">
            <strong className="font-semibold text-text-primary tabular-nums">{numero(datos.personas)}</strong>{" "}
            {datos.personas === 1 ? "persona entró" : "personas entraron"} con el link:{" "}
            <span className="tabular-nums">{numero(datos.registradas)}</span> ya registradas y{" "}
            <span className="tabular-nums">{numero(datos.nuevas)}</span> nuevas.
          </p>
          {datos.nuevas > 0 && (
            <p className="mt-1 text-xs text-text-tertiary">
              Las nuevas entraron con un email que no está en tus registros: alguien les reenvió el link o se registraron con otro email.
            </p>
          )}
        </div>
        <Button
          size="sm"
          appearance="outline"
          onPress={() =>
            descargar(csvIngresosWebinar(filas), `ingresos-webinar-${slugify(lanzamiento) || "lanzamiento"}${filtro === "todas" ? "" : `-${filtro}`}.csv`)
          }
        >
          <Download1 />
          Descargar {filtro === "todas" ? "todas" : filtro} ({numero(filas.length)})
        </Button>
      </div>

      <div role="group" aria-label="Filtrar ingresos" className="flex flex-wrap gap-2 px-5 pt-4">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={filtro === o.valor}
            onClick={() => setFiltro(o.valor)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              filtro === o.valor
                ? "bg-primary-500 text-white ring-primary-500"
                : "text-text-secondary ring-card-border hover:text-text-primary",
            )}
          >
            {o.etiqueta} <span className="tabular-nums opacity-75">{numero(o.cantidad)}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto border-t border-card-border">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-text-tertiary">
              <th scope="col" className="px-5 py-2.5 font-medium">Email</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Nombre</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Primer ingreso</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Días</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.email} className="border-t border-card-border">
                <td className="max-w-[16rem] truncate px-5 py-2.5 text-text-primary">{f.email}</td>
                <td className="px-3 py-2.5 text-text-secondary">{f.nombre ?? "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-text-secondary tabular-nums">{fechaHora(f.primerIngreso)}</td>
                <td className="px-3 py-2.5 text-right text-text-secondary tabular-nums">{f.dias}</td>
                <td className="px-5 py-2.5 text-right">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      f.registrada ? "bg-badge-blue-background text-badge-blue-text" : "bg-amber-400/15 text-amber-600 dark:text-amber-300",
                    )}
                  >
                    {f.registrada ? "Registrada" : "Nueva"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filas.length > VISIBLES && (
        <div className="border-t border-card-border px-5 py-3">
          <button
            type="button"
            onClick={() => setTodas((v) => !v)}
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {todas ? "Ver menos" : `Ver las ${numero(filas.length)}`}
          </button>
        </div>
      )}
    </Card>
  );
}
