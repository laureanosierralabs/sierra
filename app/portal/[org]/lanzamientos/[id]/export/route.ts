import { slugify } from "@/lib/escritura";
import { contextoPortal } from "@/lib/portal/contexto";
import { lanzamientoPortal } from "@/lib/portal/datos";

export const dynamic = "force-dynamic";

/** Entre comillas y con las comillas duplicadas: nombres con comas no rompen la fila. */
function celda(valor: string | null): string {
  let v = valor ?? "";
  // Una celda que empieza con = + - @ se ejecuta como fórmula al abrir el CSV
  // en Excel: el nombre lo escribe quien se registra, así que se neutraliza.
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

/**
 * Registros del lanzamiento en CSV: la tabla que el cliente pedía por
 * WhatsApp. Misma validación que la página: su organización, su lanzamiento.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const ctx = await contextoPortal(org);
  if (!ctx) return new Response("No encontrado", { status: 404 });

  const detalle = await lanzamientoPortal(ctx, id);
  if (!detalle) return new Response("No encontrado", { status: 404 });

  const pagina = new Map(detalle.paginas.map((p) => [p.id, p.name]));
  const filas = [
    ["Nombre", "Email", "Teléfono", "Landing", "Fuente", "Medio", "Campaña", "Anuncio", "Fecha (UTC)"],
    ...detalle.registros.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.page_id ? (pagina.get(r.page_id) ?? null) : null,
      r.utm_source,
      r.utm_medium,
      r.utm_campaign,
      r.utm_content,
      r.registered_at,
    ]),
  ];

  // BOM: sin él Excel abre los acentos rotos.
  const csv = `﻿${filas.map((f) => f.map(celda).join(",")).join("\r\n")}\r\n`;
  const nombre = `registros-${slugify(detalle.lanzamiento.name) || "lanzamiento"}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
