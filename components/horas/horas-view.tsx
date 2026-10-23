"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Copy1, Download1, Plus } from "@tailgrids/icons";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/landing/ui";
import { Button, buttonStyles } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { borrarHora } from "@/app/landing-pages/horas-acciones";
import {
  correrMes,
  duracionTexto,
  etiquetaMes,
  mesDe,
  paraPegarEnSheets,
  totalMinutos,
  type EntradaHora,
} from "@/lib/horas/tipos";
import { HoraForm } from "./hora-form";
import { crearColumnasHoras } from "./horas-columnas";

const TODOS = "__todos__";

interface Props {
  entradas: EntradaHora[];
  esOwner: boolean;
  userId: string;
  personas: { id: string; nombre: string }[];
  truncado: boolean;
  clientes: { id: string; name: string }[];
  /** AAAA-MM */
  mes: string;
  hoy: string;
  filtros: { persona: string | null; cliente: string | null };
}

export function HorasView({ entradas, esOwner, userId, personas, truncado, clientes, mes, hoy, filtros }: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const [formulario, setFormulario] = useState<{ entrada: EntradaHora | null } | null>(null);
  const [aBorrar, setABorrar] = useState<EntradaHora | null>(null);

  /** URL con los filtros actuales y los cambios pedidos (null = quitar). */
  const href = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const actual: Record<string, string | null> = { mes, persona: filtros.persona, cliente: filtros.cliente, ...cambios };
    for (const [k, v] of Object.entries(actual)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `${ruta}?${qs}` : ruta;
  };
  const ir = (cambios: Record<string, string | null>) => router.push(href(cambios));

  const verPersona = esOwner && !filtros.persona;
  const nombreCliente = useMemo(() => new Map(clientes.map((c) => [c.id, c.name])), [clientes]);
  const columnas = useMemo(
    () =>
      crearColumnasHoras({
        verPersona,
        nombreCliente,
        puedeTocar: (e) => esOwner || e.user_id === userId,
        onEditar: (e) => setFormulario({ entrada: e }),
        onBorrar: setABorrar,
      }),
    [verPersona, nombreCliente, esOwner, userId],
  );

  const total = totalMinutos(entradas);
  const dias = new Set(entradas.map((e) => e.work_date)).size;
  const mesActual = hoy.slice(0, 7);
  const meses = useMemo(() => {
    const lista = Array.from({ length: 12 }, (_, i) => correrMes(mesActual, -i));
    return lista.includes(mes) ? lista : [mes, ...lista];
  }, [mes, mesActual]);

  const { desde, hasta } = mesDe(`${mes}-01`);
  const exportar = new URLSearchParams({ desde, hasta });
  if (filtros.persona) exportar.set("persona", filtros.persona);
  if (filtros.cliente) exportar.set("cliente", filtros.cliente);

  async function copiarParaSheets() {
    try {
      await navigator.clipboard.writeText(paraPegarEnSheets(entradas));
      toast.success(
        `${entradas.length} ${entradas.length === 1 ? "fila copiada" : "filas copiadas"}: pegalas en la primera celda libre de "Dia"`,
      );
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  const cargar = () => setFormulario({ entrada: null });

  return (
    <>
      <PageHeader
        titulo="Horas"
        descripcion={esOwner ? "Las horas del equipo, listas para rendir" : "Cargá tus horas: se suman solas"}
        accion={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Exportar horas"
                isDisabled={entradas.length === 0}
                className={buttonStyles({ appearance: "outline", size: "md", className: "gap-2" })}
              >
                <Download1 />
                Exportar
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent placement="bottom end" className="w-72 p-1">
                <DropdownMenuItem
                  id="sheets"
                  textValue="Copiar para Google Sheets"
                  onAction={copiarParaSheets}
                  className="items-start gap-2.5 px-2.5 py-2"
                >
                  <Copy1 className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-text-primary">Copiar para Google Sheets</span>
                    <span className="block text-xs text-text-tertiary">Con las columnas de la planilla de Wonder</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  id="csv"
                  textValue="Descargar CSV"
                  href={`/landing-pages/horas/exportar?${exportar}`}
                  className="items-start gap-2.5 px-2.5 py-2"
                >
                  <Download1 className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-text-primary">Descargar CSV</span>
                    <span className="block text-xs text-text-tertiary">Excel o Google Sheets</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onPress={cargar}>
              <Plus />
              Cargar horas
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-5">
        <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Mes" className="flex items-center gap-1.5">
            <Button appearance="outline" iconOnly size="md" aria-label="Mes anterior" onPress={() => ir({ mes: correrMes(mes, -1) })}>
              <ChevronLeft />
            </Button>
            <Select aria-label="Elegir mes" value={mes} onChange={(k) => ir({ mes: String(k) })} className="w-44">
              <SelectTrigger size="md">
                <SelectValue />
                <SelectIndicator />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m) => (
                  <SelectItem key={m} id={m} textValue={etiquetaMes(m)}>
                    {etiquetaMes(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              appearance="outline"
              iconOnly
              size="md"
              aria-label="Mes siguiente"
              isDisabled={mes >= mesActual}
              onPress={() => ir({ mes: correrMes(mes, 1) })}
            >
              <ChevronRight />
            </Button>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-card-border">
            {[
              { titulo: "Total", valor: duracionTexto(total) },
              { titulo: "Días trabajados", valor: String(dias) },
              { titulo: "Promedio por día", valor: dias > 0 ? duracionTexto(Math.round(total / dias)) : "—" },
            ].map((s) => (
              <div key={s.titulo} className="px-4 first:pl-0 lg:px-6 lg:last:pr-0">
                <dt className="text-xs text-text-tertiary">{s.titulo}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-text-primary">{s.valor}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {truncado && (
          <p className="text-sm text-text-secondary">
            Hay más cargas de las que se muestran: los totales de este mes son parciales.
          </p>
        )}

        <DataTable
          columns={columnas}
          data={entradas}
          label="Horas cargadas"
          getRowId={(e) => e.id}
          searchable
          searchPlaceholder="Buscar en lo trabajado…"
          paginate
          pageSize={20}
          initialSorting={[{ id: "fecha", desc: true }]}
          toolbarActions={
            <>
              {esOwner && personas.length > 0 && (
                <Select
                  aria-label="Persona"
                  value={filtros.persona ?? TODOS}
                  onChange={(k) => ir({ persona: k === TODOS ? null : String(k) })}
                  className="w-full sm:w-48"
                >
                  <SelectTrigger size="md">
                    <SelectValue />
                    <SelectIndicator />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem id={TODOS} textValue="Todo el equipo">
                      Todo el equipo
                    </SelectItem>
                    {personas.map((p) => (
                      <SelectItem key={p.id} id={p.id} textValue={p.nombre}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                aria-label="Cliente"
                value={filtros.cliente ?? TODOS}
                onChange={(k) => ir({ cliente: k === TODOS ? null : String(k) })}
                className="w-full sm:w-48"
              >
                <SelectTrigger size="md">
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem id={TODOS} textValue="Todos los clientes">
                    Todos los clientes
                  </SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} id={c.id} textValue={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          emptyState={
            <EmptyState
              variant="inline"
              title={`Sin horas en ${etiquetaMes(mes)}`}
              description="Cargá el día, el horario y qué trabajaste: la duración se calcula sola."
              action={
                <div className="mt-3 flex justify-center">
                  <Button size="sm" onPress={cargar}>
                    <Plus />
                    Cargar horas
                  </Button>
                </div>
              }
            />
          }
        />
      </div>

      <HoraForm
        abierto={formulario !== null}
        onCerrar={() => setFormulario(null)}
        entrada={formulario?.entrada ?? null}
        hoy={hoy}
        clientes={clientes}
      />

      <ConfirmDialog
        isOpen={aBorrar !== null}
        onOpenChange={(abierto) => !abierto && setABorrar(null)}
        title="Borrar esta carga"
        description={aBorrar ? `${aBorrar.work_date} · ${aBorrar.start_time} – ${aBorrar.end_time}. No se puede deshacer.` : undefined}
        confirmLabel="Borrar"
        pendingLabel="Borrando…"
        onConfirm={() => (aBorrar ? borrarHora(aBorrar.id) : undefined)}
        successMessage="Carga borrada"
      />
    </>
  );
}
