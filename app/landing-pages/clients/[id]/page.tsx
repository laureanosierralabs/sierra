import Link from "next/link";
import { notFound } from "next/navigation";
import { accesoActual } from "@/lib/landing/auth";
import { estadoPortalCliente } from "@/lib/portal/admin";
import { PortalCliente } from "@/components/landing/portal-cliente";
import { LanzamientosCliente } from "@/components/lanzamientos/lanzamientos-cliente";
import { lanzamientosDeCliente } from "@/lib/lanzamientos/datos";
import { ProyectosConectados } from "@/components/sitios/proyectos-conectados";
import { rutasDeSitio, sitiosDeCliente } from "@/lib/sitios/datos";
import {
  ArrowLeft,
  Briefcase4,
  CheckCircle1,
  Download1,
  Envelope1,
  Folder1,
  Globe2,
  Instagram,
  Phone,
  Target3,
  UserMultiple1,
} from "@tailgrids/icons";
import {
  listarClientes,
  listarCotizaciones,
  listarNotasCliente,
  listarProyectos,
  listarRecursosCliente,
  obtenerCliente,
} from "@/lib/landing/datos";
import { formatearMonto, LABEL_ORIGEN, nombreCliente, urlInstagram, urlWhatsapp } from "@/lib/landing/tipos";
import { AgregarProyectos } from "@/components/landing/agregar-proyectos";
import { NuevaAprobacion } from "@/components/pedidos/pedido-formularios";
import { ListaPedidos } from "@/components/pedidos/pedido-ui";
import { crearAprobacion } from "@/app/landing-pages/pedidos-acciones";
import { pedidosDeCliente } from "@/lib/pedidos/datos";
import {
  EstadoClientePill,
  EstadoCotizacionPill,
  EstadoProyectoPill,
  PageHeader,
  Vencimiento,
} from "@/components/landing/ui";
import { ClienteForm } from "@/components/landing/cliente-form";
import { EnlaceBoton, EnlaceExterno } from "@/components/landing/enlace-boton";
import { NotasCliente } from "@/components/landing/notas-cliente";
import { Propiedad } from "@/components/landing/propiedad";
import { Recursos } from "@/components/landing/recursos";
import { SeccionCard } from "@/components/landing/seccion-card";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

function Texto({ valor }: { valor: string | null }) {
  return <p className="truncate">{valor || "—"}</p>;
}

function Enlace({ href, texto }: { href: string | null; texto?: string }) {
  if (!href) return <p>—</p>;
  return (
    <EnlaceExterno href={href}>
      <span className="truncate">{texto ?? href.replace(/^https?:\/\//, "")}</span>
    </EnlaceExterno>
  );
}

function Vacio({ children }: { children: React.ReactNode }) {
  return <EmptyState variant="inline" className="px-4 py-6">{children}</EmptyState>;
}

export default async function ClienteDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Lo comercial es del owner: a un member ni se le cargan las cotizaciones.
  const { esOwner } = await accesoActual();

  const [cliente, cotizaciones, proyectos, accesos, notas, portal, lanzamientos, conectados, todos, pedidos] = await Promise.all([
    obtenerCliente(id),
    esOwner ? listarCotizaciones() : Promise.resolve([]),
    listarProyectos(),
    listarRecursosCliente(id),
    listarNotasCliente(id),
    // undefined = no se pudo consultar a Clerk: la tarjeta no se muestra (si
    // no, un fallo se vería como "sin portal" y ofrecería habilitarlo de nuevo).
    esOwner ? estadoPortalCliente(id).catch(() => undefined) : Promise.resolve(undefined),
    esOwner
      ? lanzamientosDeCliente(id).catch((e) => {
          console.error("[clientes] no se pudieron leer los lanzamientos:", e);
          return [];
        })
      : Promise.resolve([]),
    // Proyectos conectados con sus landings detectadas. Si falla, la ficha
    // se sigue viendo (la tarjeta no aparece).
    esOwner
      ? sitiosDeCliente(id)
          .then((sitios) =>
            Promise.all(sitios.map(async (sitio) => ({ sitio, rutas: await rutasDeSitio(id, sitio.id) }))),
          )
          .catch((e) => {
            console.error("[clientes] no se pudieron leer los proyectos conectados:", e);
            return null;
          })
      : Promise.resolve(null),
    listarClientes(),
    pedidosDeCliente(id).catch((e) => {
      console.error("[clientes] no se pudieron leer los pedidos:", e);
      return [];
    }),
  ]);

  if (!cliente) notFound();

  // Marca y operador/a: quién opera esta marca, y qué marcas opera este cliente.
  const operador = cliente.operated_by ? (todos.find((c) => c.id === cliente.operated_by) ?? null) : null;
  const marcas = todos.filter((c) => c.operated_by === cliente.id);
  const nombrePor = new Map(todos.map((c) => [c.id, c.name]));

  const susCotizaciones = cotizaciones.filter((q) => q.client_id === id);
  const susProyectos = proyectos.filter((p) => p.client_id === id);
  const wa = urlWhatsapp(cliente.phone);
  const ig = urlInstagram(cliente.instagram);

  return (
    <>
      <Link
        href="/landing-pages/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Clientes
      </Link>

      <PageHeader
        titulo={cliente.name}
        descripcion={cliente.company ?? undefined}
        accion={
          <span className="flex items-center gap-3">
            {esOwner && (
              <EnlaceBoton
                href={`/landing-pages/clients/${cliente.id}/export`}
                descarga
                titulo="Descargar ficha en Markdown"
                icono={<Download1 />}
              >
                Exportar
              </EnlaceBoton>
            )}
            <ClienteForm cliente={cliente} operadores={todos} />
          </span>
        }
      />

      <div className="flex flex-col gap-8">
        <Card className="px-5 py-3">
          <div className="grid gap-x-10 md:grid-cols-2">
            <Propiedad icono={CheckCircle1} label="Estado">
              <EstadoClientePill estado={cliente.status} />
            </Propiedad>

            {operador && (
              <Propiedad icono={UserMultiple1} label="Operado por">
                <Link href={`/landing-pages/clients/${operador.id}`} className="font-medium hover:underline">
                  {operador.name}
                </Link>
              </Propiedad>
            )}

            {marcas.length > 0 && (
              <Propiedad icono={UserMultiple1} label="Opera">
                <span className="flex flex-wrap gap-x-2">
                  {marcas.map((m) => (
                    <Link key={m.id} href={`/landing-pages/clients/${m.id}`} className="font-medium hover:underline">
                      {m.name}
                    </Link>
                  ))}
                </span>
              </Propiedad>
            )}

            <Propiedad icono={Target3} label="Origen">
              {cliente.source ? (
                <span className="flex min-w-0 items-center gap-2">
                  <Badge color="blue" size="sm" className="shrink-0 rounded-md px-1.5">
                    {LABEL_ORIGEN[cliente.source]}
                  </Badge>
                  {cliente.source_detail && (
                    <span className="truncate text-text-secondary">{cliente.source_detail}</span>
                  )}
                </span>
              ) : (
                <Texto valor={null} />
              )}
            </Propiedad>

            <Propiedad icono={Phone} label="WhatsApp">
              {wa ? <Enlace href={wa} texto={cliente.phone ?? ""} /> : <Texto valor={cliente.phone} />}
            </Propiedad>

            <Propiedad icono={Instagram} label="Instagram">
              {ig ? (
                <Enlace href={ig} texto={cliente.instagram ?? ""} />
              ) : (
                <Texto valor={cliente.instagram} />
              )}
            </Propiedad>

            <Propiedad icono={Envelope1} label="Email">
              {cliente.email ? (
                <a href={`mailto:${cliente.email}`} className="block truncate hover:underline">
                  {cliente.email}
                </a>
              ) : (
                <Texto valor={null} />
              )}
            </Propiedad>

            <Propiedad icono={Briefcase4} label="Nicho">
              <Texto valor={cliente.niche} />
            </Propiedad>

            <Propiedad icono={Globe2} label="Sitio web">
              <Enlace href={cliente.website} />
            </Propiedad>

            <Propiedad icono={Folder1} label="Drive">
              <Enlace href={cliente.drive_url} texto="Drive de archivos" />
            </Propiedad>
          </div>

          {cliente.notes && (
            <p className="mt-3 border-t border-card-border pt-3 text-sm text-text-secondary">
              {cliente.notes}
            </p>
          )}
        </Card>

        <Recursos
          duenoId={cliente.id}
          tabla="client"
          titulo="Accesos del cliente"
          recursos={accesos}
          editable={esOwner}
        />

        <NotasCliente clientId={cliente.id} notas={notas} />

        {esOwner && conectados && (
          <ProyectosConectados clientId={cliente.id} proyectos={conectados} />
        )}

        {esOwner && <LanzamientosCliente clientId={cliente.id} lanzamientos={lanzamientos} />}

        <SeccionCard
          titulo="Pedidos"
          cantidad={pedidos.length}
          accion={
            <NuevaAprobacion
              action={crearAprobacion}
              clientId={cliente.id}
              lanzamientos={lanzamientos.map((l) => ({ id: l.id, name: l.name }))}
            />
          }
        >
          <ListaPedidos
            pedidos={pedidos}
            href={(p) => `/landing-pages/pedidos/${p}`}
            vacio="Sin pedidos. El cliente los crea desde su portal; vos podés pedirle una aprobación."
          />
        </SeccionCard>

        {esOwner && portal !== undefined && (
          <PortalCliente clientId={cliente.id} estado={portal} />
        )}

        {esOwner && (
          <SeccionCard titulo="Cotizaciones" cantidad={susCotizaciones.length}>
            {susCotizaciones.length === 0 ? (
              <Vacio>Sin cotizaciones.</Vacio>
            ) : (
              susCotizaciones.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm text-text-primary">{q.title}</span>
                    {q.proposal_url && (
                      <EnlaceExterno href={q.proposal_url}>
                        <span className="sr-only">Abrir propuesta</span>
                      </EnlaceExterno>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm tabular-nums text-text-secondary">
                      {formatearMonto(q.total_amount, q.currency)}
                    </span>
                    <EstadoCotizacionPill estado={q.commercial_status} />
                  </span>
                </div>
              ))
            )}
          </SeccionCard>
        )}

        <SeccionCard
          titulo="Proyectos"
          cantidad={susProyectos.length}
          accion={
            esOwner && (
              <AgregarProyectos
                clientId={cliente.id}
                proyectos={proyectos
                  .filter((p) => p.client_id !== id)
                  .map((p) => ({ id: p.id, name: p.name, cliente: nombreCliente(p, nombrePor) }))}
              />
            )
          }
        >
          {susProyectos.length === 0 ? (
            <Vacio>Sin proyectos.</Vacio>
          ) : (
            susProyectos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <Link
                  href={`/landing-pages/projects/${p.id}`}
                  className="min-w-0 truncate text-sm text-text-primary hover:underline"
                >
                  {p.name}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <EstadoProyectoPill estado={p.status} />
                  <Vencimiento fecha={p.due_date} cerrado={p.status === "entregado"} />
                </span>
              </div>
            ))
          )}
        </SeccionCard>
      </div>
    </>
  );
}
