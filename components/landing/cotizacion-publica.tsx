import Image from "next/image";
import type { CotizacionPublica } from "@/lib/landing/datos";
import {
  codigoCotizacion,
  fechaCotizacion,
  fechaDocumento,
  resumenPrecio,
  type ItemCotizacion,
} from "@/lib/landing/tipos";

/* Datos de contacto del pie del documento. */
const WHATSAPP = "+54 9 2221 429754";
const SITIO = "www.laureanosierra.com";

/** `$ 1,250.00 USD`, como en el documento original. */
function monto(n: number, moneda: string): string {
  const valor = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$ ${valor} ${moneda}`;
}

/** Un ítem sin precio forma parte del paquete: "Incluido" se lee como valor, $0 no. */
function Precio({ monto: n, moneda }: { monto: number; moneda: string }) {
  return n > 0 ? (
    <span className="tabular-nums">{monto(n, moneda)}</span>
  ) : (
    <span className="italic text-doc-muted">Incluido</span>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-lg bg-doc-navy px-5 py-1.5 text-[15px] font-medium text-doc-paper">
      {children}
    </span>
  );
}

function Caja({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="pl-0.5 text-[15px] text-doc-muted">{label}</span>
      <div className="rounded-xl border-2 border-doc-box px-4 py-3 text-[15px]">{children}</div>
    </div>
  );
}

/** Título en negrita y detalle entre paréntesis, con link si lo tiene. */
function Linea({ item }: { item: Pick<ItemCotizacion, "title" | "detail" | "url"> }) {
  return (
    <span>
      <strong className="font-semibold">{item.title}</strong>
      {item.detail ? (
        <>
          {" ("}
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="text-doc-link">
              {item.detail}
            </a>
          ) : (
            item.detail
          )}
          {")"}
        </>
      ) : null}
    </span>
  );
}

/**
 * Documento de cotización que ve el cliente. Es la misma pieza en pantalla y
 * en PDF (impresión del navegador): un solo diseño que mantener.
 *
 * Está pensado para que el cliente entienda por qué vale lo que vale: cada
 * parte con su precio (o "Incluido"), las extensiones colgadas de su ítem y,
 * si hay descuento por paquete, el subtotal y la bonificación a la vista.
 */
export function DocumentoCotizacionPublica({ cotizacion }: { cotizacion: CotizacionPublica }) {
  const fecha = fechaCotizacion(cotizacion);
  const moneda = cotizacion.currency;
  // Sin ítems (cotizaciones previas a los ítems), el documento muestra el
  // título con el total como única línea.
  const lineas: Pick<ItemCotizacion, "id" | "title" | "detail" | "url" | "amount" | "is_extension">[] =
    cotizacion.items.length > 0
      ? cotizacion.items
      : [
          {
            id: "total",
            title: cotizacion.title,
            detail: null,
            url: null,
            amount: cotizacion.total_amount ?? 0,
            is_extension: false,
          },
        ];
  const { subtotal, descuento, porcentaje, total } = resumenPrecio(
    cotizacion.items,
    cotizacion.total_amount,
  );
  const fila =
    "grid grid-cols-[1fr_auto] gap-4 sm:grid-cols-[1fr_15rem] print:grid-cols-[1fr_15rem]";

  return (
    <article className="mx-auto flex w-full max-w-[1000px] flex-col px-6 pt-12 pb-10 sm:px-14 print:max-w-none print:px-12 print:pt-10">
      <header className="flex items-center justify-between gap-6 border-b-4 border-doc-box pb-6">
        <Image
          src="/logotipo-azul.png"
          alt="sierra labs · web design"
          width={320}
          height={85}
          priority
          className="h-auto w-44 sm:w-52"
        />
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-xl bg-doc-navy px-6 py-2.5 text-lg font-semibold text-doc-paper sm:text-xl">
            Cotización
          </span>
          <span className="text-xs tabular-nums text-doc-muted">
            {codigoCotizacion(cotizacion.numero)}
          </span>
        </div>
      </header>

      <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_15rem] print:grid-cols-[1fr_15rem]">
        <Caja label="Nombre del cliente">{cotizacion.cliente ?? "—"}</Caja>
        <Caja label="Fecha">
          <span className="font-semibold">{fechaDocumento(fecha)}</span>
        </Caja>
      </section>

      <section className="mt-12">
        <div className={fila}>
          <div>{cotizacion.service ? <Etiqueta>{cotizacion.service}</Etiqueta> : null}</div>
          <div>
            <Etiqueta>Monto</Etiqueta>
          </div>
        </div>

        <ul className="mt-4">
          {lineas.map((item) =>
            item.is_extension ? (
              // La extensión va pegada a su ítem: sin borde arriba y con sangría.
              <li key={item.id} className={`${fila} border-b border-doc-rule py-1.5 pl-5 text-sm`}>
                <span className="flex gap-1.5">
                  <span aria-hidden="true" className="text-doc-muted">
                    ↳
                  </span>
                  <Linea item={item} />
                </span>
                <Precio monto={item.amount} moneda={moneda} />
              </li>
            ) : (
              <li key={item.id} className={`${fila} border-b border-doc-rule py-1.5 text-[15px]`}>
                <Linea item={item} />
                <Precio monto={item.amount} moneda={moneda} />
              </li>
            ),
          )}
        </ul>
      </section>

      <div className="mt-8 border-t-2 border-doc-box" />

      <section className="mt-8 flex flex-col-reverse gap-8 sm:flex-row sm:items-end sm:justify-between print:flex-row print:items-end print:justify-between">
        <div className="text-sm">
          {cotizacion.payment_terms ? (
            <p>
              <span className="text-doc-muted">Condiciones de pago: </span>
              <span className="font-medium">{cotizacion.payment_terms}</span>
            </p>
          ) : null}
        </div>

        <div className="w-full sm:w-60">
          {descuento > 0 ? (
            <dl className="mb-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm tabular-nums">
              <dt className="text-doc-muted">Subtotal</dt>
              <dd className="text-right">{monto(subtotal, moneda)}</dd>
              <dt className="text-doc-muted">
                Bonificación por paquete{porcentaje > 0 ? ` (${porcentaje}%)` : ""}
              </dt>
              <dd className="text-right">− {monto(descuento, moneda)}</dd>
            </dl>
          ) : null}
          <span className="inline-block rounded-t-lg bg-doc-navy px-5 py-1 text-sm text-doc-paper">
            Monto total
          </span>
          <div className="rounded-xl rounded-tl-none border-2 border-doc-navy px-4 py-3 text-base font-semibold tabular-nums">
            {monto(total, moneda)}
          </div>
        </div>
      </section>

      <footer className="mt-12 flex items-end justify-between gap-6 text-xs">
        <span className="flex items-center gap-3">
          {/* Solo el isotipo: se recorta del logotipo para no sumar otro archivo. */}
          <span className="block h-8 w-[30px] overflow-hidden">
            <Image
              src="/logotipo-azul.png"
              alt=""
              width={320}
              height={85}
              className="h-8 w-auto max-w-none"
            />
          </span>
          <span className="font-medium leading-tight">
            Todos los derechos
            <br />
            reservados {fecha.slice(0, 4)}®
          </span>
        </span>
        <span className="text-right leading-snug">
          WhatsApp: {WHATSAPP}
          <br />
          {SITIO}
        </span>
      </footer>
    </article>
  );
}
