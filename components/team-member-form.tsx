"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { createTeamMember, deleteTeamMember, updateTeamMember } from "@/app/equipo/actions";
import { LEADERSHIP_FIELDS, TEAM_STATUSES, TEAM_TEXT_FIELDS, projectHref, type TeamMember, type TeamProject } from "@/lib/team-fields";
import { LABEL_ESTADO_PROYECTO } from "@/lib/landing/tipos";

const inputClass = "w-full min-w-0 rounded-lg border border-line bg-ground px-3 py-2 text-sm text-text outline-none transition-colors focus:border-line-strong";
const contextLabels: Record<string, string> = { activo: "Activo", bloqueado: "Bloqueado", "por-empezar": "Por empezar", pausado: "Pausado", terminado: "Terminado" };

export function TeamMemberForm({ member, projects, mode = "edit" }: { member: TeamMember; projects: TeamProject[]; mode?: "create" | "edit" }) {
  const [values, setValues] = useState(member);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [navigating, setNavigating] = useState(false);
  const busy = saving || deleting || navigating;
  const router = useRouter();
  const edit = (key: keyof TeamMember, value: string | string[] | null) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };
  const textFields = [...TEAM_TEXT_FIELDS, ...(member.id === "laureano" ? LEADERSHIP_FIELDS : [])];
  return (
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const fd = new FormData(event.currentTarget);
      setSaving(true); setError(""); setSaved(false);
      try {
        if (mode === "create") {
          const result = await createTeamMember(fd);
          if (result.error) setError(result.error);
          else if (result.id) { setNavigating(true); router.push(`/equipo/${result.id}`); router.refresh(); }
          else setError("No se pudo confirmar la creación del perfil. Intenta nuevamente.");
        } else {
          const result = await updateTeamMember(member.id, fd);
          if (result.error) setError(result.error);
          else { setSaved(true); router.refresh(); }
        }
      } catch {
        setError("No se pudo guardar. Los cambios siguen en el formulario; intenta nuevamente.");
      } finally { setSaving(false); }
    }} className="space-y-5">
      <fieldset disabled={busy} className="min-w-0 space-y-5 disabled:opacity-70">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="min-w-0 space-y-1.5"><span className="block text-xs text-text-3">Nombre</span><input name="name" required maxLength={120} value={values.name} onChange={(e) => edit("name", e.target.value)} className={inputClass} /></label>
            <label className="min-w-0 space-y-1.5"><span className="block text-xs text-text-3">Rol</span><input name="role" required maxLength={200} value={values.role} onChange={(e) => edit("role", e.target.value)} className={inputClass} /></label>
            <label className="min-w-0 space-y-1.5"><span className="block text-xs text-text-3">Estado (opcional)</span><select name="status" value={values.status ?? ""} onChange={(e) => edit("status", e.target.value || null)} className={inputClass}>
              <option value="">Sin estado definido</option>
              {Object.entries(TEAM_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
          </div>
        </Card>
        <div className="grid gap-5 sm:grid-cols-2">
          {textFields.map(({ key, label }) => <Card key={key} className="min-w-0 p-5"><label className="block">
            <span className="mb-2 block text-sm font-bold">{label}</span>
            <textarea name={key} value={values[key]} onChange={(e) => edit(key, e.target.value)} rows={5} maxLength={10000} className={inputClass} placeholder="Una idea por línea" />
          </label></Card>)}
        </div>
        <Card className="p-5">
          <h2 className="text-sm font-bold">Proyectos actuales</h2>
          <p className="mt-1 text-xs text-text-3">Vincula proyectos existentes. Esto no cambia sus responsables ni crea proyectos nuevos.</p>
          {(["projects", "context_projects"] as const).map((source) => {
            const field = source === "projects" ? "project_ids" : "context_project_slugs";
            const options = projects.filter((p) => p.source === source);
            const missing = values[field].filter((id) => !options.some((p) => p.id === id));
            return <fieldset key={source} className="mt-5 min-w-0">
              <legend className="mb-2 text-xs font-semibold text-text-2">{source === "projects" ? "Proyectos Web" : "Proyectos de contexto"}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((project) => <div key={project.id} className="flex min-w-0 items-start gap-2 rounded-lg border border-line p-3">
                  <label className="flex min-w-0 flex-1 items-start gap-2">
                    <input type="checkbox" name={field} value={project.id} checked={values[field].includes(project.id)} onChange={(e) => edit(field, e.target.checked ? [...values[field], project.id] : values[field].filter((id) => id !== project.id))} className="mt-0.5 shrink-0 accent-text" />
                    <span className="min-w-0 break-words text-sm">{project.name}<span className="mt-0.5 block text-xs text-text-3">{source === "projects" ? LABEL_ESTADO_PROYECTO[project.status as keyof typeof LABEL_ESTADO_PROYECTO] ?? project.status : contextLabels[project.status] ?? project.status}</span></span>
                  </label>
                  <Link href={projectHref(project)} className="shrink-0 rounded p-1 text-xs text-text-2 hover:underline" aria-label={`Ver proyecto ${project.name}`}>Ver →</Link>
                </div>)}
                {missing.map((id) => <label key={id} className="flex items-start gap-2 text-xs text-warn"><input type="checkbox" name={field} value={id} checked onChange={() => edit(field, values[field].filter((value) => value !== id))} />Proyecto no disponible. Desmárcalo para guardar.</label>)}
              </div>
              {!options.length && !missing.length && <p className="text-xs text-text-3">No hay proyectos en este catálogo.</p>}
            </fieldset>;
          })}
        </Card>
      </fieldset>
      <div aria-live="polite">
        {error && <p role="alert" className="text-sm text-critical">{error}</p>}
        {saved && <p className="text-sm text-ok">Cambios guardados.</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy} onClick={() => router.push("/equipo")} className="rounded-lg px-4 py-2 text-sm text-text-2 hover:text-text disabled:opacity-50">Cancelar y volver</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-text px-4 py-2 text-sm font-semibold text-ground hover:opacity-90 disabled:opacity-50">{saving ? "Guardando…" : mode === "create" ? "Crear persona" : "Guardar cambios"}</button>
      </div>
      {mode === "edit" && <Card className="p-5">
        {confirmingDelete ? <>
          <p className="text-sm font-semibold">¿Eliminar el perfil de {member.name}?</p>
          <p className="mt-1 text-xs text-text-2">Esta acción no se puede deshacer. Solo se eliminará este perfil del equipo; sus proyectos y cuentas de usuario no se modificarán.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={async () => {
              if (busy) return;
              setDeleting(true); setDeleteError("");
              try {
                const result = await deleteTeamMember(member.id);
                if (result.error) setDeleteError(result.error);
                else { setNavigating(true); router.push("/equipo"); router.refresh(); }
              } catch {
                setDeleteError("No se pudo eliminar el perfil. Intenta nuevamente.");
              } finally { setDeleting(false); }
            }} className="rounded-lg border border-critical/30 bg-critical-dim px-4 py-2 text-sm font-semibold text-critical disabled:opacity-50">{deleting ? "Eliminando…" : "Confirmar eliminación"}</button>
            <button type="button" disabled={busy} onClick={() => { setConfirmingDelete(false); setDeleteError(""); }} className="rounded-lg px-4 py-2 text-sm text-text-2 hover:text-text disabled:opacity-50">Cancelar eliminación</button>
          </div>
        </> : <button type="button" disabled={busy} onClick={() => setConfirmingDelete(true)} className="rounded-lg px-3 py-2 text-sm font-semibold text-critical hover:bg-critical-dim disabled:opacity-50">Eliminar persona</button>}
        {deleteError && <p role="alert" className="mt-3 text-sm text-critical">{deleteError}</p>}
      </Card>}
    </form>
  );
}
