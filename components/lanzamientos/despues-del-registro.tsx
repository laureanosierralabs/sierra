"use client";

import { Download1 } from "@tailgrids/icons";
import { descargar } from "@/components/lanzamientos/exportar-registros";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { slugify } from "@/lib/escritura";
import {
  cruzarRegistrados,
  resumirCheckout,
  type Cruce,
  type DatosDespues,
} from "@/lib/lanzamientos/despues";
import type { PaginaLanzamiento, Registro } from "@/lib/lanzamientos/tipos";
import { csvRegistros, type Rango } from "@/lib/lanzamientos/vista";

const numero = (n: number) => n.toLocaleString("es-AR");
const porcentaje = (p: number | null) => (p === null ? "—" : `${p.toLocaleString("es-AR")}%`);

const COLUMNAS_CSV = ["nombre", "email", "telefono", "landing", "fecha"];

/** Un paso del recorrido: "N de M" y su porcentaje, con la descarga de quienes no lo hicieron. */
function Paso({
  titulo,
  cruce,
  onDescargar,
}: {
  titulo: string;
  cruce: Cruce;
  onDescargar: () => void;
}) {
  return (
    <li className="flex flex-col gap-1 px-5 py-4">
      <p className="text-sm text-text-tertiary">{titulo}</p>
      <p className="text-xl font-semibold text-text-primary tabular-nums">
        {numero(cruce.cruzan)} <span className="text-sm font-medium text-text-secondary">de {numero(cruce.total)}</span>{" "}
        <span className="text-sm font-medium text-text-secondary">{porcentaje(cruce.porcentaje)}</span>
      </p>
      {cruce.faltan.length > 0 && (
        <Button size="sm" appearance="outline" className="mt-1 self-start" onPress={onDescargar}>
          <Download1 className="size-4" />
          Descargar los {numero(cruce.faltan.length)} que no
        </Button>
      )}
    </li>
  );
}

/**
 * Qué pasó después del registro, medido por persona (email): cuántos
 * registrados hicieron clic al grupo de WhatsApp, cuántos se conectaron al
 * webinar con su link personal, y los clics al checkout de las páginas de
 * venta. Respeta los filtros del panel: los registrados son los de la landing
 * y el período elegidos; los clics al checkout, los de las landings elegidas
 * dentro del período. Cada bloque se oculta si no hay datos.
 */
export function DespuesDelRegistro({
  despues,
  registros,
  paginas,
  paginasFiltradas,
  rango,
  compras,
  lanzamiento,
  landing,
}: {
  despues: DatosDespues | null;
  /** Registros ya filtrados por landing y período. */
  registros: Registro[];
  /** Todas las landings (para el nombre en el CSV). */
  paginas: PaginaLanzamiento[];
  /** Las landings que se están mirando (todas, o la elegida). */
  paginasFiltradas: PaginaLanzamiento[];
  rango: Rango | null;
  /** Compras en el mismo recorte. */
  compras: number;
  lanzamiento: string;
  /** Nombre de la landing filtrada; null = todas. */
  landing: string | null;
}) {
  if (!despues) return null;

  const hayWhatsapp = despues.eventos.some((e) => e.kind === "whatsapp_click");
  const hayWebinar = despues.webinar.length > 0;
  const hayCheckoutEnLanzamiento = resumirCheckout(despues.eventos, paginas, null, 0).total > 0;
  if (!hayWhatsapp && !hayWebinar && !hayCheckoutEnLanzamiento) return null;

  const whatsapp = cruzarRegistrados(
    registros,
    despues.eventos.filter((e) => e.kind === "whatsapp_click").map((e) => e.email),
  );
  const webinar = cruzarRegistrados(
    registros,
    despues.webinar.map((e) => e.email),
  );
  const checkout = resumirCheckout(despues.eventos, paginasFiltradas, rango, compras);

  const mostrarWhatsapp = hayWhatsapp && whatsapp.total > 0;
  const mostrarWebinar = hayWebinar && webinar.total > 0;
  const mostrarCheckout = hayCheckoutEnLanzamiento;
  if (!mostrarWhatsapp && !mostrarWebinar && !mostrarCheckout) return null;

  const nombre = [slugify(lanzamiento) || "lanzamiento", landing ? slugify(landing) : null].filter(Boolean).join("-");
  const bajar = (faltan: Registro[], archivo: string) =>
    descargar(csvRegistros(faltan, COLUMNAS_CSV, paginas), `${archivo}-${nombre}.csv`);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="text-base font-semibold text-text-primary">Después del registro</h2>
        <p className="text-sm text-text-tertiary">
          De los registrados, quiénes hicieron cada paso, cruzado por email. Los clics y los ingresos son los que el
          kit y el link personal lograron medir.
        </p>
      </div>

      {(mostrarWhatsapp || mostrarWebinar) && (
        <ul className="grid grid-cols-1 divide-y divide-card-border sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] sm:divide-x sm:divide-y-0">
          {mostrarWhatsapp && (
            <Paso
              titulo="Hicieron clic en WhatsApp"
              cruce={whatsapp}
              onDescargar={() => bajar(whatsapp.faltan, "sin-clic-whatsapp")}
            />
          )}
          {mostrarWebinar && (
            <Paso
              titulo="Se conectaron al webinar"
              cruce={webinar}
              onDescargar={() => bajar(webinar.faltan, "sin-conectar-webinar")}
            />
          )}
        </ul>
      )}

      {mostrarCheckout && (
        <div className={mostrarWhatsapp || mostrarWebinar ? "border-t border-card-border" : undefined}>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-4">
            <div>
              <p className="text-sm text-text-tertiary">Clics al checkout</p>
              <p className="text-xl font-semibold text-text-primary tabular-nums">{numero(checkout.total)}</p>
            </div>
            {checkout.compras > 0 && (
              <div>
                <p className="text-sm text-text-tertiary">De clic a compra</p>
                <p className="text-xl font-semibold text-text-primary tabular-nums">
                  {porcentaje(checkout.tasaCompra)}
                  <span className="ml-2 text-sm font-medium text-text-secondary">
                    {numero(checkout.compras)} {checkout.compras === 1 ? "compra" : "compras"}
                  </span>
                </p>
              </div>
            )}
          </div>
          {checkout.porTarget.length > 0 && (
            <ul className="divide-y divide-card-border border-t border-card-border">
              {checkout.porTarget.map((t) => (
                <li key={t.target ?? "sin-boton"} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span
                    title={t.target ?? undefined}
                    className={t.target ? "min-w-0 truncate text-sm font-medium text-text-primary" : "min-w-0 truncate text-sm text-text-tertiary"}
                  >
                    {t.target ?? "Sin botón indicado"}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-text-secondary">
                    {numero(t.clics)} {t.clics === 1 ? "clic" : "clics"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
