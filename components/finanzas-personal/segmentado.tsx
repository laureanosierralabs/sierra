import Link from "next/link";
import { cn } from "@/utils/cn";

export interface OpcionSegmentada {
  value: string;
  label: string;
  href: string;
}

interface SegmentadoProps {
  label: string;
  options: OpcionSegmentada[];
  value: string;
  className?: string;
}

/** Control segmentado dirigido por la URL: cada opción es un link, así que el filtro sobrevive a un refresh. */
export function Segmentado({ label, options, value, className }: SegmentadoProps) {
  return (
    <nav aria-label={label} className={cn("max-w-full overflow-x-auto", className)}>
      <div className="inline-flex gap-0.5 rounded-lg border border-card-border bg-card-background p-0.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                active
                  ? "bg-button-primary-background text-button-primary-text"
                  : "text-text-secondary hover:bg-background-gray-secondary hover:text-text-primary",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
