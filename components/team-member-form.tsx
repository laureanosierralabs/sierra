"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/common/form/form-error";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { TeamMemberEliminar } from "@/components/team-member-eliminar";
import { SIN_ESTADO, teamMemberEsquema } from "@/components/team-member-esquema";
import { createTeamMember, updateTeamMember } from "@/app/equipo/actions";
import {
  LEADERSHIP_FIELDS,
  TEAM_STATUSES,
  TEAM_TEXT_FIELDS,
  type TeamMember,
} from "@/lib/team-fields";

const OPCIONES_ESTADO = [
  { value: SIN_ESTADO, label: "Sin estado definido" },
  ...Object.entries(TEAM_STATUSES).map(([value, label]) => ({ value, label })),
];

export function TeamMemberForm({
  member,
  mode = "edit",
}: {
  member: TeamMember;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [navegando, setNavegando] = useState(false);
  const creadoId = useRef<string | null>(null);
  const crear = mode === "create";
  const textFields = [...TEAM_TEXT_FIELDS, ...(member.id === "laureano" ? LEADERSHIP_FIELDS : [])];

  /**
   * Las actions devuelven `{ error }` en vez de lanzar: se convierte en excepción
   * para que `useZodForm` la muestre. El centinela del Select vuelve a "".
   */
  async function guardar(fd: FormData) {
    if (fd.get("status") === SIN_ESTADO) fd.set("status", "");
    if (crear) {
      const result = await createTeamMember(fd);
      if (result.error) throw new Error(result.error);
      if (!result.id) {
        throw new Error("No se pudo confirmar la creación del perfil. Intenta nuevamente.");
      }
      creadoId.current = result.id;
      return;
    }
    const result = await updateTeamMember(member.id, fd);
    if (result.error) throw new Error(result.error);
  }

  const form = useZodForm({
    schema: teamMemberEsquema,
    action: guardar,
    successMessage: crear ? "Persona creada" : "Cambios guardados",
    fallbackError: "No se pudo guardar. Los cambios siguen en el formulario; intenta nuevamente.",
    onSuccess: () => {
      if (crear && creadoId.current) {
        setNavegando(true);
        router.push(`/equipo/${creadoId.current}`);
      }
      router.refresh();
    },
  });

  const busy = form.pending || navegando;

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={form.onSubmit} className="flex flex-col gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormTextField
                {...form.fieldProps("name")}
                label="Nombre"
                required
                disabled={busy}
                defaultValue={member.name}
              />
              <FormTextField
                {...form.fieldProps("role")}
                label="Rol"
                required
                disabled={busy}
                defaultValue={member.role}
              />
              <FormSelectField
                {...form.fieldProps("status")}
                label="Estado (opcional)"
                disabled={busy}
                options={OPCIONES_ESTADO}
                defaultValue={member.status ?? SIN_ESTADO}
              />
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            {textFields.map(({ key, label }) => (
              <Card
                key={key}
                className={key === "responsibilities" ? "min-w-0 sm:col-span-2" : "min-w-0"}
              >
                <FormTextAreaField
                  {...form.fieldProps(key)}
                  label={label}
                  rows={8}
                  disabled={busy}
                  placeholder="Una idea por línea"
                  defaultValue={member[key]}
                />
              </Card>
            ))}
          </div>
        </div>

        <FormError message={form.formError} />

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            appearance="outline"
            isDisabled={busy}
            onPress={() => router.push("/equipo")}
          >
            Cancelar y volver
          </Button>
          <Button type="submit" isDisabled={busy}>
            {form.pending ? "Guardando…" : crear ? "Crear persona" : "Guardar cambios"}
          </Button>
        </div>
      </form>

      {!crear && (
        <TeamMemberEliminar
          id={member.id}
          name={member.name}
          disabled={busy}
          onNavigate={() => setNavegando(true)}
        />
      )}
    </div>
  );
}
