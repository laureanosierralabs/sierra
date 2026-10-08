import Link from "next/link";
import type { ComponentProps } from "react";
import { KpiCard } from "@/components/common/kpi-card";

type KpiEnlaceProps = ComponentProps<typeof KpiCard> & { href: string };

/** KpiCard que lleva a la pantalla donde se actúa sobre ese número. */
export function KpiEnlace({ href, ...kpi }: KpiEnlaceProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <KpiCard {...kpi} className="h-full" />
    </Link>
  );
}
