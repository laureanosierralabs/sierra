/**
 * Prompt listo para pegar en una IA (ChatGPT, Claude...): el cliente le pide
 * que analice los resultados de su lanzamiento. Lógica pura: arma el texto con
 * los mismos números que ve en pantalla (`ResultadosVista`) y no incluye datos
 * personales (ni emails, ni teléfonos, ni nombres de quienes se registraron).
 * Solo afirma lo que hay: una sección sin datos no aparece.
 */
import type { ResultadosVista } from "@/lib/lanzamientos/resultados";
import { LABEL_TIPO_LANDING } from "@/lib/lanzamientos/tipos";

export interface ContextoPrompt {
  lanzamiento: string;
  /** Texto de las fechas ("21/10 → 30/10"); null si no se cargaron. */
  fechas: string | null;
  /** Hoy (AAAA-MM-DD). */
  hoy: string;
}

const entero = (n: number) => n.toLocaleString("es-AR");
const pct = (n: number | null) => (n === null ? "sin dato" : `${n.toLocaleString("es-AR")} %`);
const diaMes = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const monto = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
/** Una celda de tabla markdown: sin barras ni saltos de línea. */
const celda = (v: string) => v.replace(/\|/g, "/").replace(/\s+/g, " ").trim();

const INSTRUCCIONES = [
  "Actúa como un analista de marketing digital y lanzamientos, con experiencia en campañas de Meta Ads y embudos de registro y venta.",
  "Te comparto los resultados de mi lanzamiento. Analízalos y respóndeme en español, con lenguaje simple y sin tecnicismos:",
  "1. Qué funcionó (con los números que lo respaldan).",
  "2. Qué no funcionó o qué me preocupa.",
  "3. Tres acciones concretas para hacer en los próximos días, ordenadas por impacto.",
  "4. Qué dato me falta medir para decidir mejor.",
  "Reglas: usa solo los datos de abajo; si algo no está medido, dilo y no lo estimes ni lo inventes. Si una muestra es muy pequeña para sacar conclusiones, avísalo. Los identificadores de campañas y anuncios son los que entrega Meta: no intentes adivinar su contenido.",
].join("\n");

function tabla(encabezados: string[], filas: string[][]): string {
  return [
    `| ${encabezados.join(" | ")} |`,
    `| ${encabezados.map(() => "---").join(" | ")} |`,
    ...filas.map((f) => `| ${f.map(celda).join(" | ")} |`),
  ].join("\n");
}

export function construirPromptIA(r: ResultadosVista, ctx: ContextoPrompt): string {
  const bloques: string[] = [INSTRUCCIONES];

  const alcance = [
    `- Lanzamiento: ${ctx.lanzamiento}`,
    ctx.fechas ? `- Fechas del lanzamiento: ${ctx.fechas}` : null,
    `- Período analizado: ${r.periodoLargo}${r.rango ? ` (${diaMes(r.rango.desde)} al ${diaMes(r.rango.hasta)})` : ""}`,
    `- Landing: ${r.landing ? `${r.landing.name} (${LABEL_TIPO_LANDING[r.landing.kind].toLowerCase()})` : "todas las landings"}`,
    `- Fecha de hoy: ${diaMes(ctx.hoy)}/${ctx.hoy.slice(0, 4)}`,
  ].filter((l): l is string => l !== null);
  bloques.push(["## Datos del lanzamiento", ...alcance].join("\n"));

  /* Totales */
  const a = r.actual;
  const totales: string[] = [];
  totales.push(
    r.hayVisitas
      ? `- Visitantes únicos: ${entero(a.visitantes)} (cada día cuenta una vez por persona; quien vuelve otro día se cuenta de nuevo)`
      : "- Visitantes únicos: sin visitas medidas",
  );
  if (a.registros > 0 || a.tipoConversion === "registro") totales.push(`- Registros: ${entero(a.registros)}`);
  totales.push(
    `- Conversión a ${a.tipoConversion === "venta" ? "venta" : "registro"}: ${a.conversion === null ? "no se puede medir" : pct(a.conversion)}`,
  );
  if (a.ventas > 0) totales.push(`- Ventas: ${entero(a.ventas)}`);
  if (r.ingresos.length > 0) {
    totales.push(
      `- Ingresos${r.precioLista ? " (según precio de lista, sin cupones ni reembolsos)" : ""}: ${r.ingresos.map(([m, t]) => `${m} ${monto(t)}`).join(" + ")}`,
    );
  }
  if (r.registrosQueCompraron !== null && a.ventas > 0) totales.push(`- Registros que compraron: ${pct(r.registrosQueCompraron)}`);
  if (r.anterior) {
    const ant = r.anterior;
    const partes = [
      ant.visitantes > 0 ? `visitantes ${entero(ant.visitantes)}` : null,
      `registros ${entero(ant.registros)}`,
      ant.conversion !== null ? `conversión ${pct(ant.conversion)}` : null,
      ant.ventas > 0 ? `ventas ${entero(ant.ventas)}` : null,
    ].filter(Boolean);
    totales.push(`- Período anterior de igual largo, para comparar: ${partes.join(", ")}`);
  }
  if (r.meta) {
    totales.push(
      `- Meta de registros del lanzamiento: ${entero(r.meta.objetivo)}; lleva ${entero(r.meta.registros)} (${r.meta.porcentaje} %)` +
        (r.meta.ritmo
          ? `; al ritmo actual llegaría a ${entero(r.meta.ritmo.proyeccion)} al cierre (día ${r.meta.ritmo.diasTranscurridos} de ${r.meta.ritmo.diasTotales})`
          : ""),
    );
  }
  bloques.push(["## Totales", ...totales].join("\n"));

  /* Serie diaria */
  const conActividad = r.serie.filter((d) => d.visitantes > 0 || d.registros > 0 || d.ventas > 0);
  if (conActividad.length > 0) {
    const mostrarVentas = r.serie.some((d) => d.ventas > 0);
    const encabezados = ["Día", "Visitantes", "Registros", ...(mostrarVentas ? ["Ventas"] : [])];
    const filas = r.serie.slice(-31).map((d) => [
      diaMes(d.dia),
      r.hayVisitas ? entero(d.visitantes) : "—",
      entero(d.registros),
      ...(mostrarVentas ? [entero(d.ventas)] : []),
    ]);
    bloques.push(["## Evolución por día", tabla(encabezados, filas)].join("\n"));
  }

  /* Embudo */
  if (r.embudo.length > 1) {
    bloques.push(
      [
        "## Embudo (cada paso con su porcentaje contra el anterior)",
        ...r.embudo.map((p) => `- ${p.etiqueta}: ${entero(p.cantidad)}${p.porcentaje !== null ? ` (${pct(p.porcentaje)} del paso anterior)` : ""}`),
      ].join("\n"),
    );
  }

  /* Fuentes */
  if (r.fuentes.length > 0) {
    const conVisitas = r.baseFuentes === "visitantes";
    const filas = r.fuentes.map((f) => [
      f.etiqueta,
      ...(conVisitas ? [entero(f.visitantes)] : []),
      entero(f.registros),
      ...(conVisitas ? [f.conversion === null ? "—" : pct(f.conversion)] : []),
    ]);
    bloques.push(
      [
        `## De dónde llega la gente (utm_source)${conVisitas ? "" : " — solo registros: no hay visitas medidas"}`,
        tabla(["Fuente", ...(conVisitas ? ["Visitantes"] : []), "Registros", ...(conVisitas ? ["Conversión"] : [])], filas),
      ].join("\n"),
    );
  }
  if (r.origenesSinUtm.length > 0) {
    bloques.push(
      [
        "## Visitas sin UTM, por sitio de origen",
        ...r.origenesSinUtm.slice(0, 6).map((o) => `- ${o.origen}: ${entero(o.visitantes)} visitantes`),
      ].join("\n"),
    );
  }

  /* Campañas y anuncios */
  const ranking = (titulo: string, filas: ResultadosVista["campanas"]["filas"]) => {
    const conValor = filas.filter((f) => f.valor !== null);
    if (conValor.length === 0) return;
    bloques.push(
      [titulo, ...conValor.map((f) => `- ${f.valor}: ${entero(f.registros)} registros (${pct(f.porcentaje)} del total)`)].join("\n"),
    );
  };
  ranking("## Campañas con más registros (utm_campaign)", r.campanas.filas);
  ranking("## Anuncios con más registros (utm_content)", r.anuncios.filas);

  /* Por landing */
  if (r.porLanding.length > 1 && !r.landing) {
    bloques.push(
      [
        "## Por landing",
        tabla(
          ["Landing", "Tipo", "Visitantes", "Registros o ventas", "Conversión"],
          r.porLanding.map((p) => [
            p.name,
            LABEL_TIPO_LANDING[p.kind],
            p.visitantes > 0 ? entero(p.visitantes) : "—",
            entero(p.conversiones),
            p.cvr === null ? "—" : pct(p.cvr),
          ]),
        ),
        ...r.comparaciones.map((c) => {
          const nombre = (id: string) => r.porLanding.find((p) => p.id === id)?.name ?? id;
          return c.significativa
            ? `Prueba A/B (${LABEL_TIPO_LANDING[c.tipo].toLowerCase()}): ${nombre(c.mejor)} convierte mejor que ${nombre(c.segunda)} y la diferencia es estadísticamente consistente (95 % de confianza).`
            : `Prueba A/B (${LABEL_TIPO_LANDING[c.tipo].toLowerCase()}): entre ${nombre(c.mejor)} y ${nombre(c.segunda)} todavía no hay una ganadora clara; la diferencia puede ser casualidad.`;
        }),
      ].join("\n"),
    );
  }

  /* Checkout */
  if (r.checkout) {
    bloques.push(
      [
        "## Checkout",
        `- Clics al checkout: ${entero(r.checkout.total)}`,
        ...(r.checkout.compras > 0 ? [`- De clic a compra: ${pct(r.checkout.tasaCompra)} (${entero(r.checkout.compras)} compras)`] : []),
      ].join("\n"),
    );
  }

  const notas: string[] = [];
  if (r.truncado) notas.push("Hay más registros de los que se pudieron leer: los totales son parciales.");
  if (r.serieAmpliada) notas.push("La tabla por día muestra los últimos 7 días, aunque los totales son de hoy.");
  if (r.ventasSinFecha > 0) notas.push(`${entero(r.ventasSinFecha)} ventas no tienen fecha conocida y no aparecen en la tabla por día.`);
  if (notas.length > 0) bloques.push(["## Notas sobre los datos", ...notas.map((n) => `- ${n}`)].join("\n"));

  return `${bloques.join("\n\n")}\n`;
}
