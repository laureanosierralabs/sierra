import { PageSkeleton } from "@/components/common/page-skeleton";

// Solo envuelve `children` del layout; el slot `@panel` tiene su propio
// boundary, así que abrir un panel interceptado no dispara este esqueleto.
export default function Loading() {
  return <PageSkeleton />;
}
