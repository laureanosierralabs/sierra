"use server";

import { revalidatePath } from "next/cache";
import { hoyISO, slugify } from "@/lib/escritura";
import { supabaseAdmin } from "@/lib/landing/supabase";
import type { Movimiento } from "@/lib/finanzas";
import { requireFinanceOwner } from "@/lib/personal-finance-server";
import { parseMoney } from "@/lib/personal-finance";

const MONEDAS = ["ARS", "USD"];
const TIPOS = ["ingreso", "egreso"];
const AMBITOS = ["negocio", "personal"];
const ESTADOS = ["pagado", "pendiente", "cobrado"];

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

function opcional(fd: FormData, campo: string): string | undefined {
  const v = texto(fd, campo);
  return v === "" ? undefined : v;
}

/** Valida y arma un movimiento desde el formulario. Todo input es no confiable. */
function parsear(fd: FormData): Movimiento {
  const fecha = texto(fd, "fecha") || hoyISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("Fecha inválida");

  const ambito = texto(fd, "ambito");
  if (!AMBITOS.includes(ambito)) throw new Error("Ámbito inválido");

  const tipo = texto(fd, "tipo");
  if (!TIPOS.includes(tipo)) throw new Error("Tipo inválido");

  const moneda = texto(fd, "moneda");
  if (!MONEDAS.includes(moneda)) throw new Error("Moneda inválida");

  const monto = parseMoney(texto(fd, "monto"));
  if (!Number.isFinite(monto) || monto <= 0) throw new Error("Monto inválido");

  const concepto = texto(fd, "concepto");
  if (!concepto) throw new Error("Falta el concepto");

  const estado = texto(fd, "estado");
  if (!ESTADOS.includes(estado)) throw new Error("Estado inválido");

  const idExistente = opcional(fd, "id");
  const id =
    idExistente ?? `${fecha}-${slugify(concepto)}-${Date.now().toString(36)}`;

  return {
    id,
    fecha,
    ambito: ambito as Movimiento["ambito"],
    tipo: tipo as Movimiento["tipo"],
    monto,
    moneda: moneda as Movimiento["moneda"],
    categoria: texto(fd, "categoria") || "otro",
    concepto,
    unidad: opcional(fd, "unidad"),
    cliente: opcional(fd, "cliente"),
    proyecto: opcional(fd, "proyecto"),
    persona: opcional(fd, "persona"),
    estado: estado as Movimiento["estado"],
    comprobante: opcional(fd, "comprobante"),
    notas: opcional(fd, "notas"),
  };
}

export async function guardarMovimiento(fd: FormData) {
  await requireFinanceOwner();
  const mov = parsear(fd);
  if (mov.ambito !== "negocio") throw new Error("Usar el nuevo formulario de finanzas personales.");
  if (texto(fd, "id")) {
    const { data, error } = await supabaseAdmin().from("movements").select("id").eq("id", mov.id).eq("ambito", "negocio").maybeSingle();
    if (error || !data) throw new Error("Movimiento del negocio no encontrado.");
  }

  const { error } = await supabaseAdmin().from("movements").upsert(mov);
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);

  revalidatePath(`/finanzas/${mov.ambito}`);
}

export async function borrarMovimiento(id: string, ambito: string) {
  await requireFinanceOwner();
  if (ambito !== "negocio") throw new Error("Usar el nuevo formulario de finanzas personales.");
  const { error } = await supabaseAdmin()
    .from("movements")
    .delete()
    .eq("id", id).eq("ambito", "negocio");

  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
  revalidatePath(`/finanzas/${ambito}`);
}
