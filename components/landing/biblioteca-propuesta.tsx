"use client";

import { Pencil1 } from "@tailgrids/icons";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { Campo, DialogoForm, Input, Select, Textarea } from "@/components/landing/dialogo-form";
import {
  borrarElementoBiblioteca,
  borrarPlantilla,
  borrarTrabajoPortfolio,
  guardarElementoBiblioteca,
  guardarTrabajoPortfolio,
  usarPlantilla,
} from "@/app/landing-pages/acciones";
import { formatearMonto, type Moneda } from "@/lib/landing/tipos";
import { borrarVideoSoporte, guardarVideoSoporte } from "@/app/landing-pages/portal-entrega-acciones";
import type { VideoSoporte } from "@/lib/portal/entrega";
import type { ElementoBiblioteca, PlantillaCotizacion, TrabajoPortfolio } from "@/lib/landing/propuesta";

/** Alta o edición de un texto de la biblioteca ("incluye" o pregunta con respuesta). */
export function ElementoBibliotecaForm({
  kind,
  elemento,
}: {
  kind: ElementoBiblioteca["kind"];
  elemento?: ElementoBiblioteca;
}) {
  const pregunta = kind === "pregunta";
  return (
    <DialogoForm
      titulo={elemento ? "Editar" : pregunta ? "Nueva pregunta" : "Nuevo ítem"}
      etiquetaAbrir={pregunta ? "Agregar pregunta" : "Agregar ítem"}
      action={guardarElementoBiblioteca}
      disparador={elemento ? <Pencil1 /> : undefined}
    >
      <input type="hidden" name="kind" value={kind} />
      {elemento && <input type="hidden" name="id" value={elemento.id} />}
      <Campo label={pregunta ? "Pregunta" : "Qué incluye"}>
        <Input
          name="title"
          required
          maxLength={300}
          defaultValue={elemento?.title ?? ""}
          placeholder={pregunta ? "¿Cómo son las formas de pago?" : "Integración del checkout de Stripe con GHL"}
        />
      </Campo>
      {pregunta && (
        <Campo label="Respuesta">
          <Textarea
            name="body"
            required
            rows={5}
            maxLength={2000}
            defaultValue={elemento?.body ?? ""}
            placeholder="Una línea por ítem si querés que salga como lista."
          />
        </Campo>
      )}
      <p className="text-xs text-text-tertiary">
        Cambiar un texto acá no modifica las cotizaciones ya armadas: cada una guarda su copia.
      </p>
    </DialogoForm>
  );
}

export function FilaBiblioteca({ elemento }: { elemento: ElementoBiblioteca }) {
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-primary">{elemento.title}</span>
        {elemento.body && (
          <span className="mt-0.5 block text-sm whitespace-pre-line text-text-secondary">{elemento.body}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <ElementoBibliotecaForm kind={elemento.kind} elemento={elemento} />
        <BorrarBoton etiqueta="Borrar de la biblioteca" onConfirmar={() => borrarElementoBiblioteca(elemento.id)} />
      </span>
    </li>
  );
}

/* ───────────── Plantillas ───────────── */

/** Crea una cotización nueva desde la plantilla y la abre. */
function UsarPlantilla({ plantilla, clientes }: { plantilla: PlantillaCotizacion; clientes: { id: string; name: string }[] }) {
  return (
    <DialogoForm
      titulo={`Nueva cotización: ${plantilla.name}`}
      etiquetaAbrir="Usar"
      action={usarPlantilla}
      etiquetaEnviar="Crear cotización"
      etiquetaEnviando="Creando…"
    >
      <input type="hidden" name="template_id" value={plantilla.id} />
      <Campo label="Título">
        <Input name="title" required maxLength={200} defaultValue={plantilla.name} />
      </Campo>
      <Campo label="Cliente">
        <Select name="client_id" defaultValue="">
          <option value="">Sin cliente por ahora</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Campo>
      <p className="text-xs text-text-tertiary">
        Sale como borrador con los ítems, lo que incluye, el diagrama, el plazo y las preguntas de la plantilla. Después
        ajustás lo que haga falta.
      </p>
    </DialogoForm>
  );
}

export function FilaPlantilla({
  plantilla,
  clientes,
}: {
  plantilla: PlantillaCotizacion;
  clientes: { id: string; name: string }[];
}) {
  const principales = plantilla.items.filter((i) => !i.is_extension).length;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-primary">{plantilla.name}</span>
        <span className="text-xs text-text-tertiary">
          {[
            plantilla.total_amount !== null ? formatearMonto(plantilla.total_amount, plantilla.currency as Moneda) : null,
            `${principales} ${principales === 1 ? "ítem" : "ítems"}`,
            plantilla.includes.length ? `${plantilla.includes.length} incluye` : null,
            plantilla.funnel.length ? "con diagrama" : null,
            plantilla.delivery_time,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <UsarPlantilla plantilla={plantilla} clientes={clientes} />
        <BorrarBoton etiqueta="Borrar plantilla" onConfirmar={() => borrarPlantilla(plantilla.id)} />
      </span>
    </li>
  );
}

/* ───────────── Portfolio ───────────── */

export function TrabajoPortfolioForm({ trabajo }: { trabajo?: TrabajoPortfolio }) {
  return (
    <DialogoForm
      titulo={trabajo ? "Editar trabajo" : "Nuevo trabajo"}
      etiquetaAbrir="Agregar trabajo"
      action={guardarTrabajoPortfolio}
      disparador={trabajo ? <Pencil1 /> : undefined}
    >
      {trabajo && <input type="hidden" name="id" value={trabajo.id} />}
      <Campo label="Nombre">
        <Input name="title" required maxLength={60} defaultValue={trabajo?.title ?? ""} placeholder="Páginas de venta" />
      </Campo>
      <Campo label="Imagen (link)">
        <Input
          name="image_url"
          type="url"
          required
          defaultValue={trabajo?.image_url ?? ""}
          placeholder="https://laureanosierra.com/…/captura.jpg"
        />
      </Campo>
      <Campo label="Link al trabajo (opcional)">
        <Input name="link" type="url" defaultValue={trabajo?.link ?? ""} placeholder="https://…" />
      </Campo>
      <p className="text-xs text-text-tertiary">Sale al pie de las propuestas, en el orden en que lo cargás.</p>
    </DialogoForm>
  );
}

export function TarjetaPortfolio({ trabajo }: { trabajo: TrabajoPortfolio }) {
  return (
    <li className="overflow-hidden rounded-lg border border-card-border">
      {/* eslint-disable-next-line @next/next/no-img-element -- imágenes de sitios del portfolio, de cualquier dominio */}
      <img src={trabajo.image_url} alt="" loading="lazy" className="h-28 w-full object-cover" />
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="min-w-0 truncate text-sm font-medium text-text-primary">{trabajo.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <TrabajoPortfolioForm trabajo={trabajo} />
          <BorrarBoton etiqueta="Borrar del portfolio" onConfirmar={() => borrarTrabajoPortfolio(trabajo.id)} />
        </span>
      </div>
    </li>
  );
}

/* ───────────── Videos de soporte (portal) ───────────── */

export function VideoSoporteForm({ video }: { video?: VideoSoporte }) {
  return (
    <DialogoForm
      titulo={video ? "Editar video" : "Nuevo video de soporte"}
      etiquetaAbrir="Agregar video"
      action={guardarVideoSoporte}
      disparador={video ? <Pencil1 /> : undefined}
    >
      {video && <input type="hidden" name="id" value={video.id} />}
      <Campo label="Título">
        <Input name="title" required maxLength={80} defaultValue={video?.title ?? ""} placeholder="Cómo acceder a WordPress" />
      </Campo>
      <Campo label="Link del video">
        <Input name="url" type="url" required defaultValue={video?.url ?? ""} placeholder="https://youtu.be/… o https://loom.com/…" />
      </Campo>
      <p className="text-xs text-text-tertiary">
        Se ve en el portal de todos los clientes, en cada lanzamiento. Con YouTube sale con su miniatura.
      </p>
    </DialogoForm>
  );
}

export function FilaVideo({ video }: { video: VideoSoporte }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-text-primary">{video.title}</span>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-text-tertiary hover:underline">
          {video.url.replace(/^https?:\/\//, "")}
        </a>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <VideoSoporteForm video={video} />
        <BorrarBoton etiqueta="Borrar video" onConfirmar={() => borrarVideoSoporte(video.id)} />
      </span>
    </li>
  );
}
