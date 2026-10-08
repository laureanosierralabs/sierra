import { z } from "zod";
import { FECHA } from "@/components/landing/esquema-comun";

export const CATEGORIAS_EGRESO = [
  { value: "equipo", label: "Equipo" },
  { value: "suscripcion", label: "Suscripción" },
  { value: "herramienta", label: "Herramienta" },
  { value: "impuesto", label: "Impuesto" },
  { value: "otro", label: "Otro" },
];

export const CATEGORIAS_INGRESO = [
  { value: "cliente", label: "Cliente" },
  { value: "otro", label: "Otro" },
];

export const TIPOS = [
  { value: "egreso", label: "Egreso" },
  { value: "ingreso", label: "Ingreso" },
];

export const MONEDAS = [
  { value: "ARS", label: "Pesos (ARS)" },
  { value: "USD", label: "Dólares (USD)" },
];

export const ESTADOS_MOVIMIENTO = [
  { value: "pagado", label: "Pagado" },
  { value: "pendiente", label: "Pendiente" },
  { value: "cobrado", label: "Cobrado" },
];

function unaDe(opciones: { value: string }[], mensaje: string) {
  return z
    .string()
    .trim()
    .refine((v) => opciones.some((o) => o.value === v), mensaje);
}

/**
 * Espejo de `parsear` en app/finanzas/acciones.ts (con `parseMoney` de
 * lib/personal-finance.ts), solo para feedback inmediato.
 *
 *   fecha    -> vacía (el server usa hoy) o AAAA-MM-DD ("Fecha inválida")
 *   ambito   -> negocio | personal ("Ámbito inválido"); campo oculto
 *   tipo, moneda, estado -> una de sus opciones
 *   monto    -> `^-?\d+([.,]\d{1,2})?$`, hasta 999999999999.99 y mayor a cero
 *   concepto -> obligatorio, tras trim ("Falta el concepto")
 *   categoria, persona, cliente, id -> libres
 */
export const movimientoEsquema = z.object({
  id: z.string().optional(),
  ambito: unaDe([{ value: "negocio" }, { value: "personal" }], "Ámbito inválido"),
  fecha: z
    .string()
    .trim()
    .refine((v) => v === "" || FECHA.test(v), "Fecha inválida"),
  tipo: unaDe(TIPOS, "Tipo inválido"),
  moneda: unaDe(MONEDAS, "Moneda inválida"),
  monto: z.string().superRefine((v, ctx) => {
    const raw = v.trim();
    if (!/^-?\d+(?:[.,]\d{1,2})?$/.test(raw)) {
      ctx.addIssue({
        code: "custom",
        message: "Monto inválido: usar decimales sin separadores de miles.",
      });
      return;
    }
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || Math.abs(n) > 999999999999.99 || n <= 0) {
      ctx.addIssue({ code: "custom", message: "Monto inválido." });
    }
  }),
  concepto: z.string().trim().min(1, "Falta el concepto"),
  categoria: z.string().optional(),
  estado: unaDe(ESTADOS_MOVIMIENTO, "Estado inválido"),
  persona: z.string().optional(),
  cliente: z.string().optional(),
});
