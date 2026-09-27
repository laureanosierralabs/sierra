import "server-only";

import { cargarFinanzas, type PorMoneda } from "@/lib/landing/balance";
import { nombreMes } from "@/lib/landing/meses";
import {
  LABEL_CATEGORIA_GASTO,
  LABEL_ESTADO_COTIZACION,
  LABEL_ESTADO_PAGO,
  LABEL_PERIODO,
  codigoAcuerdo,
  codigoCotizacion,
  costoMensual,
  formatearMonto,
  pendienteDeCobro,
  pendienteDePago,
  type Moneda,
} from "@/lib/landing/tipos";
import { listarClientes, listarProyectos } from "@/lib/landing/datos";

function montos(t: PorMoneda): string {
  const partes = (Object.entries(t) as [Moneda, number][])
    .filter(([, v]) => Math.round(v * 100) !== 0)
    .map(([m, v]) => formatearMonto(v, m));
  return partes.length > 0 ? partes.join(" · ") : "0";
}

/**
 * Informe en Markdown pensado para pegarle a una IA y preguntarle por el
 * estado del negocio. Incluye el criterio de cada número, no solo el número:
 * sin eso, quien lo lea no puede distinguir caja real de compromiso futuro.
 */
export async function informeMarkdown(): Promise<string> {
  const datos = await cargarFinanzas();
  const [proyectos, clientes] = await Promise.all([
    listarProyectos(),
    listarClientes(),
  ]);

  const { balance, cotizaciones, acuerdos, gastos } = datos;
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));
  const clientePor = new Map(clientes.map((c) => [c.id, c.company ?? c.name]));
  const hoy = new Date().toISOString().slice(0, 10);

  const l: string[] = [];
  l.push("# Estado financiero — Landing Pages", "");
  l.push(`Fecha: ${hoy}`, "");
  l.push(
    "> Cifras de gestión, no contables. El dinero cobrado y el comprometido",
    "> se informan por separado a propósito.",
    "",
  );

  l.push("## Resumen", "");
  l.push(`- **Cobrado**: ${montos(balance.cobrado)} — dinero efectivamente recibido`);
  l.push(`- **Por cobrar**: ${montos(balance.porCobrar)} — cotizaciones aprobadas con saldo`);
  l.push(`- **Previsión**: ${montos(balance.prevision)} — borradores y enviadas, sin aprobar`);
  l.push(`- **Por pagar al equipo**: ${montos(balance.porPagar)} — comprometido e impago`);
  l.push(`- **Gasto fijo mensual**: ${montos(balance.gastoMensual)}`);
  l.push(`- **Resultado real**: ${montos(balance.resultadoReal)} — cobrado − pagado − gastos`);
  l.push(
    `- **Resultado proyectado**: ${montos(balance.resultadoProyectado)} — real + por cobrar − por pagar`,
  );
  l.push("");

  const cobradas = cotizaciones.filter((q) => q.amount_paid > 0);
  if (cobradas.length) {
    l.push("## Cotizaciones cobradas", "");
    for (const q of cobradas) {
      const nombres = q.project_ids.map((id) => proyectoPor.get(id) ?? "?").join(", ");
      l.push(
        `- **${codigoCotizacion(q.numero)} · ${q.title}** — ${formatearMonto(q.amount_paid, q.currency)} de ${formatearMonto(q.total_amount, q.currency)}`,
      );
      l.push(`  - Cliente: ${q.client_id ? (clientePor.get(q.client_id) ?? "—") : "—"}`);
      if (nombres) l.push(`  - Proyectos: ${nombres}`);
    }
    l.push("");
  }

  const porCobrar = cotizaciones.filter(
    (q) => q.commercial_status === "approved" && pendienteDeCobro(q) > 0,
  );
  if (porCobrar.length) {
    l.push("## Cuentas por cobrar", "");
    for (const q of porCobrar) {
      l.push(
        `- **${codigoCotizacion(q.numero)} · ${q.title}** — resta ${formatearMonto(pendienteDeCobro(q), q.currency)} de ${formatearMonto(q.total_amount, q.currency)}`,
      );
      l.push(`  - Cliente: ${q.client_id ? (clientePor.get(q.client_id) ?? "—") : "—"}`);
      if (q.payment_terms) l.push(`  - Condiciones: ${q.payment_terms}`);
    }
    l.push("");
  }

  const previsión = cotizaciones.filter(
    (q) => q.commercial_status === "draft" || q.commercial_status === "sent",
  );
  if (previsión.length) {
    l.push("## Previsión comercial", "");
    l.push("_Todavía sin aprobar: no son cuentas por cobrar._", "");
    for (const q of previsión) {
      l.push(
        `- **${codigoCotizacion(q.numero)} · ${q.title}** — ${formatearMonto(q.total_amount, q.currency)} (${LABEL_ESTADO_COTIZACION[q.commercial_status]})`,
      );
    }
    l.push("");
  }

  if (acuerdos.length) {
    l.push("## Equipo", "");
    const porPersona = new Map<string, typeof acuerdos>();
    for (const a of acuerdos) {
      porPersona.set(a.member_name, [...(porPersona.get(a.member_name) ?? []), a]);
    }

    for (const [persona, lista] of porPersona) {
      const comprometido = lista.reduce((t, a) => t + (a.total_amount ?? 0), 0);
      const pagado = lista.reduce((t, a) => t + a.amount_paid, 0);
      l.push(`### ${persona}`, "");
      l.push(`- Comprometido: ${formatearMonto(comprometido, "USD")}`);
      l.push(`- Pagado: ${formatearMonto(pagado, "USD")}`);
      l.push(`- Pendiente: ${formatearMonto(comprometido - pagado, "USD")}`);
      l.push("- Acuerdos:");
      for (const a of lista) {
        const nombres = a.project_ids.map((id) => proyectoPor.get(id) ?? "?").join(", ");
        l.push(
          `  - ${codigoAcuerdo(a.numero)} ${a.title} — ${formatearMonto(a.total_amount, a.currency)}, resta ${formatearMonto(pendienteDePago(a), a.currency)} (${LABEL_ESTADO_PAGO[a.payment_status]})${nombres ? ` · ${nombres}` : " · por horas"}`,
        );
      }
      l.push("");
    }
  }

  if (gastos.length) {
    l.push("## Gastos operativos", "");
    for (const g of gastos) {
      l.push(
        `- **${g.name}** — ${formatearMonto(g.amount, g.currency)} ${LABEL_PERIODO[g.period].toLowerCase()} (${formatearMonto(costoMensual(g), g.currency)}/mes) · ${LABEL_CATEGORIA_GASTO[g.category]}`,
      );
    }
    l.push("", `Total mensual: ${montos(balance.gastoMensual)}`, "");
  }

  if (balance.margenes.length) {
    l.push("## Rentabilidad por proyecto", "");
    l.push(
      "_\"Sin asignar\" = la cotización cubre varios proyectos y no se repartió el monto._",
      "",
    );
    for (const m of balance.margenes) {
      if (m.ingreso === null) {
        l.push(`- **${m.nombre}** — ingreso sin asignar · costo equipo ${formatearMonto(m.costo, m.currency)}`);
      } else {
        l.push(
          `- **${m.nombre}** — venta ${formatearMonto(m.ingreso, m.currency)}, equipo ${formatearMonto(m.costo, m.currency)}, margen ${formatearMonto(m.margen ?? 0, m.currency)} (${m.margenPct?.toFixed(1)}%)`,
        );
      }
    }
    l.push("");
  }

  if (balance.margenesCliente.length) {
    l.push("## Rentabilidad por cliente", "");
    for (const c of balance.margenesCliente) {
      l.push(
        `- **${c.cliente}** — venta ${formatearMonto(c.ingreso, c.currency)}, equipo ${formatearMonto(c.costo, c.currency)}, margen ${formatearMonto(c.margen, c.currency)}${c.margenPct !== null ? ` (${c.margenPct.toFixed(1)}%)` : ""}`,
      );
    }
    l.push("");
  }

  if (balance.meses.length) {
    l.push("## Balance mensual", "");
    l.push("| Mes | Ingresos | Equipo | Gastos | Resultado |");
    l.push("| --- | --- | --- | --- | --- |");
    for (const m of balance.meses) {
      l.push(
        `| ${nombreMes(m.mes)} | ${montos(m.ingresos)} | ${montos(m.costosEquipo)} | ${montos(m.gastos)} | ${montos(m.resultado)} |`,
      );
    }
    l.push("");
  }

  l.push("## Cómo leer estos datos", "");
  l.push("- Una cotización que cubre varios proyectos se cuenta **una sola vez**.");
  l.push("- Un borrador **no** es una cuenta por cobrar: todavía nadie lo aprobó.");
  l.push("- El resultado real solo incluye movimientos con fecha de pago efectiva.");
  l.push("- Los gastos anuales se prorratean; los únicos pesan solo en su mes.");
  l.push(
    "- El costo de equipo de un acuerdo que cubre varios proyectos se reparte en partes iguales; el ingreso **no**.",
  );
  l.push("");

  return l.join("\n");
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function tabla(titulo: string, cabecera: string[], filas: unknown[][]): string {
  const l = [`# ${titulo}`, cabecera.join(",")];
  for (const f of filas) l.push(f.map(csvEscape).join(","));
  return l.join("\n");
}

/** Un solo CSV con bloques: se abre en Excel sin perder las relaciones. */
export async function exportarCsv(): Promise<string> {
  const datos = await cargarFinanzas();
  const [proyectos, clientes] = await Promise.all([
    listarProyectos(),
    listarClientes(),
  ]);
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));
  const clientePor = new Map(clientes.map((c) => [c.id, c.company ?? c.name]));

  const bloques: string[] = [];

  bloques.push(
    tabla(
      "Cotizaciones",
      ["codigo", "titulo", "cliente", "proyectos", "total", "moneda", "cobrado", "pendiente", "estado", "estado_pago", "quote_id"],
      datos.cotizaciones.map((q) => [
        codigoCotizacion(q.numero),
        q.title,
        q.client_id ? (clientePor.get(q.client_id) ?? "") : "",
        q.project_ids.map((id) => proyectoPor.get(id) ?? id).join(" | "),
        q.total_amount ?? "",
        q.currency,
        q.amount_paid,
        pendienteDeCobro(q),
        LABEL_ESTADO_COTIZACION[q.commercial_status],
        LABEL_ESTADO_PAGO[q.payment_status],
        q.id,
      ]),
    ),
  );

  bloques.push(
    tabla(
      "Cobros",
      ["cotizacion", "fecha", "monto", "moneda", "medio", "quote_id"],
      datos.cobros.flatMap(({ q, pagos }) =>
        pagos.map((p) => [
          codigoCotizacion(q.numero),
          p.paid_on,
          p.amount,
          q.currency,
          p.method ?? "",
          q.id,
        ]),
      ),
    ),
  );

  bloques.push(
    tabla(
      "Acuerdos de equipo",
      ["codigo", "para", "concepto", "proyectos", "fecha", "total", "moneda", "pagado", "resta", "estado", "agreement_id"],
      datos.acuerdos.map((a) => [
        codigoAcuerdo(a.numero),
        a.member_name,
        a.title,
        a.project_ids.map((id) => proyectoPor.get(id) ?? id).join(" | "),
        a.agreed_on ?? "",
        a.total_amount ?? "",
        a.currency,
        a.amount_paid,
        pendienteDePago(a),
        LABEL_ESTADO_PAGO[a.payment_status],
        a.id,
      ]),
    ),
  );

  bloques.push(
    tabla(
      "Pagos a equipo",
      ["acuerdo", "para", "fecha", "monto", "moneda", "medio", "agreement_id"],
      datos.pagosEquipo.flatMap(({ a, pagos }) =>
        pagos.map((p) => [
          codigoAcuerdo(a.numero),
          a.member_name,
          p.paid_on,
          p.amount,
          a.currency,
          p.method ?? "",
          a.id,
        ]),
      ),
    ),
  );

  bloques.push(
    tabla(
      "Gastos operativos",
      ["nombre", "categoria", "monto", "moneda", "periodicidad", "por_mes", "desde", "hasta"],
      datos.gastos.map((g) => [
        g.name,
        LABEL_CATEGORIA_GASTO[g.category],
        g.amount,
        g.currency,
        LABEL_PERIODO[g.period],
        costoMensual(g).toFixed(2),
        g.active_from,
        g.active_until ?? "",
      ]),
    ),
  );

  bloques.push(
    tabla(
      "Balance mensual",
      ["mes", "ingresos_usd", "equipo_usd", "gastos_usd", "resultado_usd"],
      datos.balance.meses.map((m) => [
        m.mes,
        m.ingresos.USD.toFixed(2),
        m.costosEquipo.USD.toFixed(2),
        m.gastos.USD.toFixed(2),
        m.resultado.USD.toFixed(2),
      ]),
    ),
  );

  bloques.push(
    tabla(
      "Rentabilidad por proyecto",
      ["proyecto", "cliente", "ingreso", "costo_equipo", "margen", "margen_pct", "moneda", "project_id"],
      datos.balance.margenes.map((m) => [
        m.nombre,
        m.cliente ?? "",
        m.ingreso ?? "sin asignar",
        m.costo.toFixed(2),
        m.margen ?? "",
        m.margenPct?.toFixed(2) ?? "",
        m.currency,
        m.id,
      ]),
    ),
  );

  return bloques.join("\n\n");
}

export async function exportarJson(): Promise<string> {
  const datos = await cargarFinanzas();
  const [proyectos, clientes] = await Promise.all([
    listarProyectos(),
    listarClientes(),
  ]);
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));
  const clientePor = new Map(clientes.map((c) => [c.id, c.company ?? c.name]));

  return JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      unit: "landing-pages",
      notes: {
        cobrado: "Dinero efectivamente recibido.",
        por_cobrar: "Cotizaciones aprobadas con saldo pendiente.",
        prevision: "Borradores y enviadas: todavía no aprobadas.",
        resultado_real: "Cobrado menos pagos al equipo menos gastos. Solo caja efectiva.",
        resultado_proyectado: "Real más por cobrar menos por pagar.",
        allocated_amount:
          "Ingreso atribuible a un proyecto dentro de una cotización. Null = sin asignar; no se reparte por promedio.",
      },
      summary: {
        cobrado: datos.balance.cobrado,
        por_cobrar: datos.balance.porCobrar,
        prevision: datos.balance.prevision,
        por_pagar_equipo: datos.balance.porPagar,
        gasto_fijo_mensual: datos.balance.gastoMensual,
        resultado_real: datos.balance.resultadoReal,
        resultado_proyectado: datos.balance.resultadoProyectado,
      },
      quotes: datos.cotizaciones.map((q) => ({
        id: q.id,
        code: codigoCotizacion(q.numero),
        title: q.title,
        client: q.client_id ? (clientePor.get(q.client_id) ?? null) : null,
        projects: q.project_ids.map((id) => ({
          id,
          name: proyectoPor.get(id) ?? null,
          allocated_amount: q.allocated[id] ?? null,
        })),
        total_amount: q.total_amount,
        currency: q.currency,
        amount_paid: q.amount_paid,
        pending: pendienteDeCobro(q),
        commercial_status: q.commercial_status,
        payment_status: q.payment_status,
        payments: datos.cobros.find((c) => c.q.id === q.id)?.pagos ?? [],
      })),
      team_costs: datos.acuerdos.map((a) => ({
        id: a.id,
        code: codigoAcuerdo(a.numero),
        member: a.member_name,
        title: a.title,
        projects: a.project_ids.map((id) => ({
          id,
          name: proyectoPor.get(id) ?? null,
        })),
        agreed_on: a.agreed_on,
        total_amount: a.total_amount,
        currency: a.currency,
        amount_paid: a.amount_paid,
        pending: pendienteDePago(a),
        payment_status: a.payment_status,
        payments: datos.pagosEquipo.find((p) => p.a.id === a.id)?.pagos ?? [],
      })),
      expenses: datos.gastos.map((g) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        amount: g.amount,
        currency: g.currency,
        period: g.period,
        monthly_equivalent: Number(costoMensual(g).toFixed(2)),
        active_from: g.active_from,
        active_until: g.active_until,
      })),
      monthly_balance: datos.balance.meses,
      profitability: datos.balance.margenes,
      profitability_by_client: datos.balance.margenesCliente,
    },
    null,
    2,
  );
}
