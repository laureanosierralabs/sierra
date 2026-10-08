"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "@tailgrids/icons";
import { Button } from "@/components/tailgrids/core/button";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import type { FinanceData } from "@/lib/personal-finance";
import { availableMonths, monthLongLabel, shiftMonth } from "@/lib/personal-finance-stats";
import { capitalize, type FinanceQuery } from "../tipos";
import { buildHref } from "../url";

/** Mes anterior / selector / mes siguiente. El mes elegido vive en la URL (`?month=`). */
export function MonthNav({
  data,
  month,
  query,
}: {
  data: FinanceData;
  month: string;
  query: FinanceQuery;
}) {
  const router = useRouter();
  const go = (next: string) => router.push(buildHref(query, { month: next }));

  return (
    <div role="group" aria-label="Mes" className="flex items-center gap-1.5">
      <Button
        appearance="outline"
        iconOnly
        size="md"
        aria-label="Mes anterior"
        onPress={() => go(shiftMonth(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <Select
        aria-label="Elegir mes"
        value={month}
        onChange={(key: string) => go(String(key))}
        className="w-44"
      >
        <SelectTrigger size="md">
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectContent>
          {availableMonths(data, month).map((m) => (
            <SelectItem key={m} id={m} textValue={capitalize(monthLongLabel(m))}>
              {capitalize(monthLongLabel(m))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        appearance="outline"
        iconOnly
        size="md"
        aria-label="Mes siguiente"
        onPress={() => go(shiftMonth(month, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
