import { Envelope1, Video, Whatsapp } from "@tailgrids/icons";
import { PASOS, etiquetaDe, type PasoEmbudo } from "@/lib/landing/embudo";
import { cn } from "@/utils/cn";

/** Celular esquemático, como en las propuestas en PDF: pantalla, video, tres tarjetas y botón. */
function Celular({ titulo }: { titulo: string }) {
  return (
    <figure className="flex w-28 shrink-0 flex-col items-center gap-2 sm:w-32">
      <figcaption className="text-center text-sm font-medium">{titulo}</figcaption>
      <div className="embudo-celular flex aspect-[9/12] w-full flex-col gap-1.5 rounded-2xl border-[3px] border-doc-ink bg-doc-paper p-2.5">
        <span className="mx-auto h-1 w-7 rounded-full bg-doc-ink" />
        <span className="mx-auto h-1 w-3/4 rounded-full bg-doc-rule" />
        <span className="mx-auto h-1 w-1/2 rounded-full bg-doc-rule" />
        <span className="mx-auto mt-0.5 flex h-6 w-2/3 items-center justify-center rounded bg-doc-muted/50">
          <span className="ml-0.5 h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-doc-paper" />
        </span>
        <span className="mt-auto grid grid-cols-3 gap-1">
          <span className="h-7 rounded-sm bg-doc-ink" />
          <span className="h-7 rounded-sm bg-doc-ink" />
          <span className="h-7 rounded-sm bg-doc-ink" />
        </span>
        <span className="h-2 rounded-full bg-doc-ink" />
      </div>
    </figure>
  );
}

/** Integración: el logo o un ícono reconocible, con su nombre. */
function Integracion({ paso }: { paso: PasoEmbudo }) {
  const nombre = etiquetaDe(paso);
  let marca: React.ReactNode;
  switch (paso.tipo) {
    case "stripe":
      marca = <span className="text-3xl font-bold tracking-tight text-[#635bff]">stripe</span>;
      break;
    case "whatsapp":
      marca = (
        <span className="flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white [&>svg]:size-8">
          <Whatsapp />
        </span>
      );
      break;
    case "email":
      marca = (
        <span className="flex size-14 items-center justify-center rounded-full bg-doc-navy text-doc-paper [&>svg]:size-7">
          <Envelope1 />
        </span>
      );
      break;
    case "zoom":
      marca = (
        <span className="flex size-14 items-center justify-center rounded-full bg-[#2d8cff] text-white [&>svg]:size-7">
          <Video />
        </span>
      );
      break;
    default:
      marca = (
        <span className="rounded-lg border-2 border-doc-ink px-3 py-2 text-sm font-semibold whitespace-nowrap">{nombre}</span>
      );
  }
  return (
    <figure className="flex shrink-0 flex-col items-center gap-2">
      {marca}
      {paso.tipo !== "stripe" && !["formulario", "hotmart", "ghl", "mailerlite"].includes(paso.tipo) && (
        <figcaption className="text-xs text-doc-muted">{nombre}</figcaption>
      )}
    </figure>
  );
}

/**
 * Flecha entre pasos. Animada, una señal la recorre; cada flecha arranca un
 * poco después que la anterior, así se lee el recorrido de punta a punta.
 */
function Flecha({ indice, animado }: { indice: number; animado: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn("embudo-flecha relative flex h-6 w-10 shrink-0 items-center sm:w-14", animado && "embudo-flecha--animada")}
      style={{ "--embudo-delay": `${indice * 0.45}s` } as React.CSSProperties}
    >
      <span className="h-0.5 w-full bg-doc-ink" />
      <span className="absolute right-0 h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-doc-ink" />
    </span>
  );
}

/**
 * Diagrama del embudo de una propuesta. `animado` en el link web; en el PDF
 * (y con "reducir movimiento" del sistema) queda quieto.
 */
export function DiagramaEmbudo({ pasos, animado = true }: { pasos: PasoEmbudo[]; animado?: boolean }) {
  if (pasos.length === 0) return null;
  const nodos: React.ReactNode[] = [];
  let flechas = 0;
  pasos.forEach((p, i) => {
    if (p.tipo === "separador") {
      nodos.push(<span key={`sep-${i}`} aria-hidden="true" className="mx-2 h-40 w-px shrink-0 bg-doc-rule" />);
      return;
    }
    const anterior = pasos[i - 1];
    if (anterior && anterior.tipo !== "separador") {
      nodos.push(<Flecha key={`f-${i}`} indice={flechas++} animado={animado} />);
    }
    nodos.push(
      PASOS[p.tipo].categoria === "pagina" ? (
        <Celular key={`p-${i}`} titulo={etiquetaDe(p)} />
      ) : (
        <Integracion key={`i-${i}`} paso={p} />
      ),
    );
  });

  return (
    <div
      role="img"
      aria-label={`Embudo: ${pasos.filter((p) => p.tipo !== "separador").map(etiquetaDe).join(" → ")}`}
      className="flex flex-wrap items-center justify-center gap-y-6 break-inside-avoid"
    >
      {nodos}
    </div>
  );
}
