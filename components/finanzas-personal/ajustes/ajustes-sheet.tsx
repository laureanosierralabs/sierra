"use client";

import { useState } from "react";
import { Gear1, Pencil1, Plus } from "@tailgrids/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import {
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/tailgrids/core/sheet";
import type { FinanceData } from "@/lib/personal-finance";
import { useFinanceDialogs } from "../editores/dialogos";
import { SeedCard, needsSeed } from "./seed-card";

/** Ajustes de finanzas: categorías (alta y edición) y, si corresponde, la carga inicial. */
export function AjustesSheet({ data }: { data: FinanceData }) {
  const [isOpen, setIsOpen] = useState(false);
  const { openEntity } = useFinanceDialogs();

  return (
    <>
      <Button appearance="outline" onPress={() => setIsOpen(true)}>
        <Gear1 />
        Ajustes
      </Button>
      <SheetOverlay isOpen={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-card-border px-5 py-4 pr-12">
            <SheetTitle>Ajustes de finanzas</SheetTitle>
            <SheetDescription>Categorías personales y carga inicial.</SheetDescription>
          </SheetHeader>

          <SheetBody className="mx-0 flex flex-col gap-6 px-5 py-5">
            {needsSeed(data) && <SeedCard />}

            <section aria-labelledby="ajustes-categorias" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="ajustes-categorias" className="font-semibold text-text-primary">
                  Categorías
                </h3>
                <Button
                  size="sm"
                  onPress={() => openEntity("category", { title: "Crear categoría" })}
                >
                  <Plus />
                  Crear categoría
                </Button>
              </div>

              {data.categories.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  Todavía no hay categorías. Se crean solas al registrar un movimiento, o podés
                  crearlas acá.
                </p>
              ) : (
                <ul className="divide-y divide-card-border rounded-xl border border-card-border">
                  {data.categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {String(category.name)}
                        </p>
                        <div className="mt-1 flex gap-1.5">
                          <Badge size="sm" color={category.kind === "ingreso" ? "success" : "orange"}>
                            {category.kind === "ingreso" ? "Ingreso" : "Gasto"}
                          </Badge>
                          {!category.active && (
                            <Badge size="sm" color="gray">
                              Inactiva
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        appearance="outline"
                        size="sm"
                        iconOnly
                        aria-label={`Editar categoría ${category.name}`}
                        onPress={() =>
                          openEntity("category", { row: category, title: "Editar categoría" })
                        }
                      >
                        <Pencil1 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </SheetBody>
        </SheetContent>
      </SheetOverlay>
    </>
  );
}
