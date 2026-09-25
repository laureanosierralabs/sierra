import { auth } from "@clerk/nextjs/server";
import {
  listarCotizaciones,
  listarNotasCliente,
  listarProyectos,
  listarRecursosCliente,
  obtenerCliente,
} from "@/lib/landing/datos";
import {
  LABEL_ESTADO_CLIENTE,
  LABEL_ESTADO_COTIZACION,
  LABEL_ESTADO_PROYECTO,
  LABEL_ORIGEN,
  formatearMonto,
} from "@/lib/landing/tipos";

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Exporta la ficha del cliente a Markdown. Incluye datos, accesos (usuario y
 * URL) y transcripciones — pero NUNCA las contraseñas: un .md en Descargas no
 * es lugar para credenciales de clientes.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) return new Response("No encontrado", { status: 404 });

  const [proyectos, cotizaciones, accesos, notas] = await Promise.all([
    listarProyectos(),
    listarCotizaciones(),
    listarRecursosCliente(id),
    listarNotasCliente(id),
  ]);

  const susProyectos = proyectos.filter((p) => p.client_id === id);
  const susCotizaciones = cotizaciones.filter((q) => q.client_id === id);

  const l: string[] = [];
  const campo = (k: string, v: string | null) => {
    if (v) l.push(`- **${k}:** ${v}`);
  };

  l.push(`# ${cliente.name}`, "");
  if (cliente.company) l.push(`_${cliente.company}_`, "");

  l.push("## Datos");
  campo("Estado", LABEL_ESTADO_CLIENTE[cliente.status]);
  campo(
    "Origen",
    cliente.source
      ? `${LABEL_ORIGEN[cliente.source]}${cliente.source_detail ? ` — ${cliente.source_detail}` : ""}`
      : null,
  );
  campo("Nicho", cliente.niche);
  campo("Email", cliente.email);
  campo("WhatsApp", cliente.phone);
  campo("Instagram", cliente.instagram);
  campo("Sitio web", cliente.website);
  campo("Drive", cliente.drive_url);
  l.push("");

  if (cliente.notes) l.push("## Notas", "", cliente.notes, "");

  if (accesos.length > 0) {
    l.push("## Accesos", "");
    for (const a of accesos) {
      l.push(`### ${a.name}`);
      campo("URL", a.url);
      campo("Usuario", a.username);
      if (a.tieneSecreto) l.push("- **Contraseña:** guardada en el panel");
      campo("Notas", a.notes);
      l.push("");
    }
  }

  if (susProyectos.length > 0) {
    l.push("## Proyectos", "");
    for (const p of susProyectos) {
      l.push(
        `- **${p.name}** — ${LABEL_ESTADO_PROYECTO[p.status]}${p.due_date ? ` · entrega ${p.due_date}` : ""}`,
      );
    }
    l.push("");
  }

  if (susCotizaciones.length > 0) {
    l.push("## Cotizaciones", "");
    for (const q of susCotizaciones) {
      l.push(
        `- **${q.title}** — ${formatearMonto(q.amount, q.currency)} · ${LABEL_ESTADO_COTIZACION[q.status]}${q.sent_at ? ` · enviada ${q.sent_at}` : ""}`,
      );
    }
    l.push("");
  }

  if (notas.length > 0) {
    l.push("## Reuniones y transcripciones", "");
    for (const n of notas) {
      l.push(`### ${n.title}${n.meeting_date ? ` — ${n.meeting_date}` : ""}`);
      if (n.url) l.push(`[Ver grabación](${n.url})`, "");
      if (n.body) l.push(n.body, "");
    }
  }

  l.push("---", `_Exportado el ${new Date().toISOString().slice(0, 10)}_`);

  return new Response(l.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug(cliente.name)}.md"`,
    },
  });
}
