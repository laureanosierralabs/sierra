"use client";

import { useMemo, useState } from "react";
import { Download1 } from "@tailgrids/icons";
import { descargar } from "@/components/lanzamientos/exportar-registros";
import { Card } from "@/components/tailgrids/core/card";
import { slugify } from "@/lib/escritura";
import { ingresosWebinar, type EventoWebinar } from "@/lib/lanzamientos/despues";
import type { PaginaLanzamiento, Registro } from "@/lib/lanzamientos/tipos";
import { csvIngresosWebinar, csvRegistros, fechaHora } from "@/lib/lanzamientos/vista";
import { cn } from "@/utils/cn";

type Filtro = "todas" | "registradas" | "nuevas";

const numero = (n: number) => n.toLocaleString("es-AR");
const VISIBLES = 50;
const COLUMNAS_NO_ENTRARON = ["nombre", "email", "telefono", "landing", "fecha"];

const BOTON_DESCARGA =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-text-secondary ring-1 ring-card-border transition-colors outline-none hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-40 [&>svg]:size-3.5";

function Numero({ valor, etiqueta, detalle }: { valor: number; etiqueta: string; detalle: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl px-4 py-3 ring-1 ring-card-border">
      <p className="text-xs text-text-tertiary">{etiqueta}</p>
      <p className="text-2xl font-semibold text-text-primary tabular-nums">{numero(valor)}</p>
      <p className="text-xs text-text-tertiary">{detalle}</p>
    </div>
  );
}

/**
 * Quién entró al webinar con el link personal. Arriba, los números y una
 * descarga por grupo (todas, registradas, nuevas, registrados que no
 * entraron); la lista persona por persona queda plegada. `registros` tiene que
 * ser el lanzamiento completo: el estado no cambia con los filtros de período
 * o landing.
 */
export function IngresosWebinar({
  registros,
  webinar,
  lanzamiento,
  paginas,
}: {
  registros: Registro[];
  webinar: EventoWebinar[];
  lanzamiento: string;
  paginas: Pick<PaginaLanzamiento, "id" | "name">[];
}) {
  const datos = useMemo(() => ingresosWebinar(registros, webinar), [registros, webinar]);
  const [verLista, setVerLista] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [todas, setTodas] = useState(false);

  if (datos.personas === 0) return null;

  const base = `webinar-${slugify(lanzamiento) || "lanzamiento"}`;
  const filas = datos.filas.filter((f) => (filtro === "todas" ? true : filtro === "registradas" ? f.registrada : !f.registrada));
  const visibles = todas ? filas : filas.slice(0, VISIBLES);
  const opciones: { valor: Filtro; etiqueta: string; cantidad: number }[] = [
    { valor: "todas", etiqueta: "Todas", cantidad: datos.personas },
    { valor: "registradas", etiqueta: "Registradas", cantidad: datos.registradas },
    { valor: "nuevas", etiqueta: "Nuevas", cantidad: datos.nuevas },
  ];
  const descargas = [
    {
      etiqueta: "Todos los que entraron",
      cantidad: datos.personas,
      bajar: () => descargar(csvIngresosWebinar(datos.filas), `${base}-entraron.csv`),
    },
    {
      etiqueta: "Registrados que entraron",
      cantidad: datos.registradas,
      bajar: () => descargar(csvIngresosWebinar(datos.filas.filter((f) => f.registrada)), `${base}-registrados-que-entraron.csv`),
    },
    {
      etiqueta: "Nuevos",
      cantidad: datos.nuevas,
      bajar: () => descargar(csvIngresosWebinar(datos.filas.filter((f) => !f.registrada)), `${base}-nuevos.csv`),
    },
    {
      etiqueta: "Registrados que no entraron",
      cantidad: datos.noEntraron.length,
      bajar: () => descargar(csvRegistros(datos.noEntraron, COLUMNAS_NO_ENTRARON, paginas), `${base}-no-entraron.csv`),
    },
  ];

  return (
    <Card className="flex flex-col gap-0 p-0">
      <div className="flex flex-col gap-4 px-5 pt-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Ingresos al webinar</h3>
          <p className="mt-1 text-sm text-text-secondary">Quién entró con el link personal, cruzado con los registros del lanzamiento.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero valor={datos.personas} etiqueta="Entraron" detalle="Personas distintas, por email" />
          <Numero valor={datos.registradas} etiqueta="Ya registradas" detalle="Estaban en los registros" />
          <Numero valor={datos.nuevas} etiqueta="Nuevas" detalle="Link reenviado u otro email" />
          <Numero valor={datos.noEntraron.length} etiqueta="Registradas que no entraron" detalle="Para la repetición o el seguimiento" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-tertiary">Descargar CSV:</span>
          {descargas.map((d) => (
            <button key={d.etiqueta} type="button" disabled={d.cantidad === 0} onClick={d.bajar} className={BOTON_DESCARGA}>
              <Download1 />
              {d.etiqueta} <span className="tabular-nums opacity-70">{numero(d.cantidad)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-card-border px-5 py-3">
        <button
          type="button"
          aria-expanded={verLista}
          onClick={() => setVerLista((v) => !v)}
          className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          {verLista ? "Ocultar la lista" : `Ver la lista de los ${numero(datos.personas)}`}
        </button>
      </div>

      {verLista && (
        <>
          <div role="group" aria-label="Filtrar ingresos" className="flex flex-wrap gap-2 px-5 pb-3">
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

          <div className="overflow-x-auto border-t border-card-border">
            <table className="w-full min-w-136 text-left text-sm">
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
        </>
      )}
    </Card>
  );
}
