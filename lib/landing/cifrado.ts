import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

/**
 * Cifrado de credenciales. La clave vive en el entorno, nunca en la base:
 * quien acceda a los datos ve texto cifrado, no contraseñas de clientes.
 *
 * AES-256-GCM además autentica: un dato alterado falla al descifrar en vez
 * de devolver basura silenciosamente.
 */

const ALGORITMO = "aes-256-gcm";

function clave(): Buffer {
  const secreto = process.env.CREDENTIALS_KEY;
  if (!secreto || secreto.length < 32) {
    throw new Error(
      "Falta CREDENTIALS_KEY en el entorno (mínimo 32 caracteres).",
    );
  }
  // Normaliza cualquier largo a los 32 bytes que pide AES-256.
  return createHash("sha256").update(secreto).digest();
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITMO, clave(), iv);
  const datos = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    datos.toString("base64"),
  ].join(".");
}

export function descifrar(guardado: string): string | null {
  const partes = guardado.split(".");
  if (partes.length !== 3) return null;

  try {
    const [iv, tag, datos] = partes.map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv(ALGORITMO, clave(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(datos),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Clave cambiada o dato corrupto: no romper la página por esto.
    return null;
  }
}

export function hayClave(): boolean {
  return Boolean(
    process.env.CREDENTIALS_KEY && process.env.CREDENTIALS_KEY.length >= 32,
  );
}
