"use client";

import { Layers2, Table2 } from "@tailgrids/icons";
import {
  TabContent,
  TabList,
  TabRoot,
  TabTrigger,
} from "@/components/tailgrids/core/tabs";

/** Alterna entre las tareas reales y los SOPs que las generan. */
export function VistaTareas({
  tareas,
  procesos,
}: {
  tareas: React.ReactNode;
  procesos: React.ReactNode;
}) {
  return (
    <TabRoot defaultValue="tareas" className="border-0">
      <div className="w-fit">
        <TabList>
          <TabTrigger value="tareas" icon={<Table2 />}>
            Tareas
          </TabTrigger>
          <TabTrigger value="procesos" icon={<Layers2 />}>
            Procesos
          </TabTrigger>
        </TabList>
      </div>

      <TabContent value="tareas" className="p-0 pt-4">
        {tareas}
      </TabContent>
      <TabContent value="procesos" className="p-0 pt-4">
        {procesos}
      </TabContent>
    </TabRoot>
  );
}
