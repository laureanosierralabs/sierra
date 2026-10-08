import Link from "next/link";
import { ArrowLeft } from "@tailgrids/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <p className="text-7xl leading-none font-semibold tracking-tight text-primary-500 tabular-nums">
        404
      </p>
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-2xl leading-8 font-semibold text-title-50">Página no encontrada</h1>
        <p className="text-sm text-text-secondary">
          La página que buscás no existe o se movió a otro lugar.
        </p>
      </div>
      <Link href="/" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-button-primary-background px-3.5 text-sm font-medium text-button-primary-text transition outline-none hover:bg-button-primary-hover-background focus:ring-4 focus:ring-button-primary-focus-ring [&>svg]:size-5">
        <ArrowLeft />
        Volver al inicio
      </Link>
    </div>
  );
}
