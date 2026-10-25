import { cn } from "@/utils/cn";
import type { ComponentProps } from "react";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("skeleton-marca h-3 rounded-full", className)}
      {...props}
    />
  );
}
