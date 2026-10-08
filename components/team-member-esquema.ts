import { z } from "zod";
import { TEAM_STATUSES } from "@/lib/team-fields";

/** El Select de React Aria no admite un valor vacío: "sin estado" viaja con este centinela. */
export const SIN_ESTADO = "__ninguno__";

const OBLIGATORIO = "Es necesario completar el nombre y el rol.";

function texto(campo: string, limite: number) {
  return z
    .string()
    .trim()
    .max(limite, `El campo ${campo} supera el máximo de ${limite} caracteres.`);
}

function textoLargo(campo: string) {
  return texto(campo, 10000).optional();
}

/**
 * Espejo de `parseTeamUpdate` (lib/team-fields.ts), solo para feedback inmediato.
 *
 *   name   -> obligatorio, máx. 120 tras trim
 *   role   -> obligatorio, máx. 200 tras trim
 *   status -> vacío (o centinela) o una clave de TEAM_STATUSES ("El estado no es válido.")
 *   responsibilities, autonomous_decisions, approval_required -> máx. 10000
 *   does, delegates, approves, monitors -> máx. 10000 (el server solo los lee para "laureano")
 */
export const teamMemberEsquema = z.object({
  name: texto("name", 120).min(1, OBLIGATORIO),
  role: texto("role", 200).min(1, OBLIGATORIO),
  status: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || v === SIN_ESTADO || Object.hasOwn(TEAM_STATUSES, v),
      "El estado no es válido.",
    ),
  responsibilities: textoLargo("responsibilities"),
  autonomous_decisions: textoLargo("autonomous_decisions"),
  approval_required: textoLargo("approval_required"),
  does: textoLargo("does"),
  delegates: textoLargo("delegates"),
  approves: textoLargo("approves"),
  monitors: textoLargo("monitors"),
});
