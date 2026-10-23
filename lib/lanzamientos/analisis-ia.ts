import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { metricasParaAnalisis, type MetricasAnalisis } from "@/lib/lanzamientos/analisis-metricas";

export { metricasParaAnalisis, type MetricasAnalisis };

/**
 * Análisis de un lanzamiento redactado por IA para el cliente. El resultado es
 * un BORRADOR: el owner lo revisa y lo aprueba antes de que salga. Nunca lanza:
 * devuelve `{ ok: false, error }` y el que llama decide qué hacer.
 */
export type ResultadoAnalisis = { ok: true; texto: string } | { ok: false; error: string };

const SYSTEM = `Sos analista en una agencia que corre lanzamientos digitales y le escribís el análisis final a tu cliente.

Vas a recibir un JSON con los números del lanzamiento. Redactá un análisis en español, en un tono cercano y profesional (podés tutear con "vos", sin jerga).

Reglas:
- Basá TODO únicamente en los números que recibís. No inventes datos, causas, comparaciones con otros lanzamientos ni benchmarks de mercado.
- Si un dato falta o no se mide (por ejemplo la inversión en publicidad, o los campos listados en "datos_no_disponibles"), decilo con claridad en vez de suponerlo, y no calcules métricas que dependan de él.
- Si los ingresos son precio de lista, aclaralo cuando los menciones.
- Citá cifras concretas (visitantes, registros, conversión, nombres de landings, fuentes, campañas) para sostener cada afirmación.
- Si hay meta de registros, decí si se alcanzó y por cuánto.
- Si no hay suficiente información para afirmar algo, es mejor omitirlo que adivinar.

Formato: texto plano, sin Markdown, sin viñetas con símbolos ni emojis. Tres secciones, cada una con su título solo en una línea y debajo uno o dos párrafos cortos:
Qué funcionó
Qué no funcionó
Qué mejorar para el próximo lanzamiento

Extensión total: entre 250 y 400 palabras. No agregues saludo ni despedida.`;

/** Llama a Claude con las métricas del lanzamiento y devuelve el texto del análisis. */
export async function generarAnalisis(metricas: MetricasAnalisis): Promise<ResultadoAnalisis> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: false, error: "Falta configurar ANTHROPIC_API_KEY en el servidor" };
  }

  try {
    const client = new Anthropic(); // lee ANTHROPIC_API_KEY
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(metricas) }],
    });

    if (res.stop_reason === "refusal") {
      return { ok: false, error: "La IA se negó a generar el análisis" };
    }

    const texto = res.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();
    if (!texto) return { ok: false, error: "La IA no devolvió texto" };
    return { ok: true, texto };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "La IA está saturada: probá de nuevo en unos minutos" };
    }
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: `La IA respondió con un error (${e.status ?? "sin estado"}): ${e.message}` };
    }
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo hablar con la IA" };
  }
}
