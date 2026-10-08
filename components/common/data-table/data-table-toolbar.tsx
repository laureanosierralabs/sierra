"use client";

import type { Table } from "@tanstack/react-table";
import { Search1 } from "@tailgrids/icons";
import type { ReactNode } from "react";
import { Input } from "@/components/tailgrids/core/input";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { TextField } from "@/components/tailgrids/core/text-field";
import type { DataTableFacet } from "./types";

const ALL = "__all__";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchable: boolean;
  searchPlaceholder: string;
  facets: DataTableFacet[];
  actions?: ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchable,
  searchPlaceholder,
  facets,
  actions,
}: DataTableToolbarProps<TData>) {
  if (!searchable && facets.length === 0 && !actions) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      {searchable && (
        <TextField
          aria-label={searchPlaceholder}
          value={String(table.getState().globalFilter ?? "")}
          onChange={(value) => table.setGlobalFilter(value)}
          className="relative w-full sm:w-64"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-tertiary [&>svg]:size-4"
          >
            <Search1 />
          </span>
          <Input type="search" placeholder={searchPlaceholder} className="w-full pl-9" />
        </TextField>
      )}

      {facets.map((facet) => {
        const current = table.getColumn(facet.columnId)?.getFilterValue();
        return (
          <Select
            key={facet.columnId}
            aria-label={facet.label}
            value={typeof current === "string" ? current : ALL}
            onChange={(key) =>
              table
                .getColumn(facet.columnId)
                ?.setFilterValue(key === ALL ? undefined : String(key))
            }
            className="w-full sm:w-48"
          >
            <SelectTrigger size="lg">
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id={ALL} textValue={facet.label}>
                {facet.label}: todos
              </SelectItem>
              {facet.options.map((option) => (
                <SelectItem key={option.value} id={option.value} textValue={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}

      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
