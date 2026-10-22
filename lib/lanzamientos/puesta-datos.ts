import "server-only";

import { listarRecursosCliente } from "@/lib/landing/datos";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { conexionDeLanzamiento, lanzamientoDeCliente } from "@/lib/lanzamientos/datos";
import { evaluarPuesta, type Chequeo } from "@/lib/lanzamientos/puesta";
import type { EstadoLanzamiento } from "@/lib/lanzamientos/tipos";
import { estadoPortalCliente } from "@/lib/portal/admin";

export interface PuestaLanzamiento {
  id: string;
  nombre: string;
  estado: EstadoLanzamiento;
  chequeos: Chequeo[];
}

export interface PuestaCliente {
  id: string;
  nombre: string;
  operador: string | null;
  /** undefined = Clerk no respondió; null = sin portal. */
  portal: { slug: string; personas: number } | null | undefined;
  portada: boolean;
  accesosEnPortal: number;
  lanzamientos: PuestaLanzamiento[];
}

/**
 * Todo lo que hace falta para la pantalla "Puesta a punto": cada cliente con
 * portal o con lanzamientos en curso, y la lista "Listo para compartir" de
 * cada lanzamiento que no está cerrado. Solo para el owner.
 */
export async function puestaAPunto(): Promise<PuestaCliente[]> {
  const db = supabaseAdmin();
  const [{ data: orgs }, { data: lanzamientos }, { data: clientes }] = await Promise.all([
    db.from("client_orgs").select("client_id"),
    db.from("launches").select("id, client_id, name, status").neq("status", "cerrado"),
    db.from("clients").select("id, name, operated_by, portal_cover_url"),
  ]);

  const nombrePor = new Map((clientes ?? []).map((c) => [c.id as string, c.name as string]));
  const ids = [
    ...new Set([
      ...(orgs ?? []).map((o) => o.client_id as string),
      ...(lanzamientos ?? []).map((l) => l.client_id as string),
    ]),
  ].filter((id) => nombrePor.has(id));

  const resultado = await Promise.all(
    ids.map(async (clientId): Promise<PuestaCliente> => {
      const cliente = (clientes ?? []).find((c) => c.id === clientId);
      const [estado, accesos] = await Promise.all([
        estadoPortalCliente(clientId).catch(() => undefined),
        listarRecursosCliente(clientId).catch(() => []),
      ]);
      const portal =
        estado === undefined
          ? undefined
          : estado
            ? { slug: estado.slug, personas: estado.miembros.length + estado.invitaciones.length }
            : null;
      const accesosEnPortal = accesos.filter((a) => a.portal_visible).length;
      const portada = Boolean(cliente?.portal_cover_url);

      const suyos = (lanzamientos ?? []).filter((l) => l.client_id === clientId);
      const evaluados = await Promise.all(
        suyos.map(async (l): Promise<PuestaLanzamiento | null> => {
          const [detalle, conexion] = await Promise.all([
            lanzamientoDeCliente(clientId, l.id as string).catch(() => null),
            conexionDeLanzamiento(clientId, l.id as string).catch(() => null),
          ]);
          if (!detalle) return null;
          return {
            id: l.id as string,
            nombre: l.name as string,
            // El detalle ya pasó por el cierre automático de vencidos.
            estado: detalle.lanzamiento.status,
            chequeos: evaluarPuesta({
              lanzamiento: detalle.lanzamiento,
              paginas: detalle.paginas,
              registros: detalle.registros,
              visitas: detalle.visitas,
              compras: detalle.compras,
              mailerliteConectado: conexion?.conectado ?? false,
              portal:
                portal === undefined
                  ? undefined
                  : { habilitado: portal !== null, personas: portal?.personas ?? 0, portada },
              accesosEnPortal,
            }),
          };
        }),
      );

      return {
        id: clientId,
        nombre: nombrePor.get(clientId) ?? "Cliente",
        operador: cliente?.operated_by ? (nombrePor.get(cliente.operated_by as string) ?? null) : null,
        portal,
        portada,
        accesosEnPortal,
        lanzamientos: evaluados.filter((x): x is PuestaLanzamiento => x !== null && x.estado !== "cerrado"),
      };
    }),
  );

  return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
