import type { Moneda, TotalMoneda } from "@/lib/finanzas";

export const CAT_LABEL: Record<string, string> = {
  equipo: "Equipo",
  suscripcion: "Suscripciones",
  herramienta: "Herramientas",
  impuesto: "Impuestos",
  cliente: "Clientes",
  otro: "Otro",
};

export function fmt(monto: number, moneda: Moneda): string {
  const n = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Math.abs(monto),
  );
  const signo = monto < 0 ? "-" : "";
  return moneda === "USD" ? `${signo}US$ ${n}` : `${signo}$ ${n}`;
}

/** Muestra ARS y USD por separado; omite la moneda en cero. */
export function Montos({ total, className }: { total: TotalMoneda; className?: string }) {
  const partes: string[] = [];
  if (total.ARS !== 0) partes.push(fmt(total.ARS, "ARS"));
  if (total.USD !== 0) partes.push(fmt(total.USD, "USD"));
  if (partes.length === 0) partes.push("$ 0");
  return (
    <span className={className}>
      {partes.map((p, i) => (
        <span key={i} className="block leading-tight">
          {p}
        </span>
      ))}
    </span>
  );
}
