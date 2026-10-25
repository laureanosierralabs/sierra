import { Cargando } from "@/components/common/lattice-loader";

/** Mientras carga una pantalla del portal: el loader de la marca, centrado. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Cargando className="text-white/60" />
    </div>
  );
}
