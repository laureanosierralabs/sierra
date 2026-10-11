import Image from "next/image";
import type { CotizacionPublica } from "@/lib/landing/datos";
import { fechaCotizacion, fechaDocumento } from "@/lib/landing/tipos";

/* Datos de contacto del pie del documento. */
const WHATSAPP = "+54 9 2221 429754";
const SITIO = "www.laureanosierra.com";

/** `$ 1,250.00 USD`, como en el documento original. */
function monto(n: number, moneda: string): string {
  const valor = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$ ${valor} ${moneda}`;
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-lg px-5 py-1.5 text-[15px] font-medium text-doc-paper bg-doc-navy">
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

/**
 * Documento de cotización que ve el cliente. Es la misma pieza en pantalla y
 * en PDF (impresión del navegador): un solo diseño que mantener.
 */
export function DocumentoCotizacionPublica({ cotizacion }: { cotizacion: CotizacionPublica }) {
  const fecha = fechaCotizacion(cotizacion);
  // Sin ítems (cotizaciones previas a los ítems), el documento muestra el
  // título con el total como única línea.
  const lineas =
    cotizacion.items.length > 0
      ? cotizacion.items
      : [
          {
            id: "total",
            title: cotizacion.title,
            detail: null,
            url: null,
            amount: cotizacion.total_amount ?? 0,
          },
        ];

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
        <span
          className="rounded-xl px-6 py-2.5 text-lg font-semibold text-doc-paper sm:text-xl bg-doc-navy">
          Cotización
        </span>
      </header>

      <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_15rem] print:grid-cols-[1fr_15rem]">
        <Caja label="Nombre del cliente">{cotizacion.cliente ?? "—"}</Caja>
        <Caja label="Fecha">
          <span className="font-semibold">{fechaDocumento(fecha)}</span>
        </Caja>
      </section>

      <section className="mt-12">
        <div className="grid grid-cols-[1fr_auto] gap-4 sm:grid-cols-[1fr_15rem] print:grid-cols-[1fr_15rem]">
          <div>{cotizacion.service ? <Etiqueta>{cotizacion.service}</Etiqueta> : null}</div>
          <div>
            <Etiqueta>Monto</Etiqueta>
          </div>
        </div>

        <ul className="mt-4">
          {lineas.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[1fr_auto] gap-4 border-b border-doc-rule py-1.5 text-[15px] sm:grid-cols-[1fr_15rem] print:grid-cols-[1fr_15rem]"
            >
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
              <span className="tabular-nums">{monto(item.amount, cotizacion.currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 border-t-2 border-doc-box" />

      <section className="mt-8 flex justify-end">
        <div className="w-full sm:w-60">
          <span
            className="inline-block rounded-t-lg px-5 py-1 text-sm text-doc-paper bg-doc-navy">
            Monto total
          </span>
          <div
            className="rounded-xl rounded-tl-none border-2 px-4 py-3 text-base font-semibold tabular-nums border-doc-navy">
            {monto(cotizacion.total_amount ?? 0, cotizacion.currency)}
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
