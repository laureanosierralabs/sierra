import { NextResponse } from "next/server";
import { accesoActual } from "@/lib/landing/auth";
import {
  exportarCsv,
  exportarJson,
  informeMarkdown,
} from "@/lib/landing/exportar";

const FORMATOS = {
  csv: { tipo: "text/csv; charset=utf-8", ext: "csv", generar: exportarCsv },
  json: { tipo: "application/json; charset=utf-8", ext: "json", generar: exportarJson },
  md: { tipo: "text/markdown; charset=utf-8", ext: "md", generar: informeMarkdown },
} as const;

type Formato = keyof typeof FORMATOS;

/** Los datos financieros son del owner: el rol se valida acá también. */
export async function GET(req: Request) {
  const { esOwner } = await accesoActual();
  if (!esOwner) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const formato = new URL(req.url).searchParams.get("formato") ?? "";
  if (!(formato in FORMATOS)) {
    return new NextResponse("Formato inválido", { status: 400 });
  }

  const { tipo, ext, generar } = FORMATOS[formato as Formato];
  const contenido = await generar();
  const nombre = `finanzas-landing-pages-${new Date().toISOString().slice(0, 10)}.${ext}`;

  return new NextResponse(contenido, {
    headers: {
      "Content-Type": tipo,
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
