import { esProyectoActivo, type EstadoProyecto } from "./landing/tipos";

export const TEAM_STATUSES = {
  disponible: "Disponible",
  trabajando: "Trabajando",
  bloqueado: "Bloqueado",
  "esperando-aprobacion": "Esperando aprobación",
} as const;

export const TEAM_TEXT_FIELDS = [
  { key: "responsibilities", label: "Responsabilidades" },
  { key: "autonomous_decisions", label: "Puede decidir solo" },
  { key: "approval_required", label: "Necesita aprobación de Laureano" },
] as const;

export const LEADERSHIP_FIELDS = [
  { key: "does", label: "HAGO" },
  { key: "delegates", label: "DELEGO" },
  { key: "approves", label: "APRUEBO" },
  { key: "monitors", label: "MONITOREO" },
] as const;

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  responsibilities: string;
  autonomous_decisions: string;
  approval_required: string;
  status: keyof typeof TEAM_STATUSES | null;
  project_ids: string[];
  context_project_slugs: string[];
  does: string;
  delegates: string;
  approves: string;
  monitors: string;
}

export interface TeamProject {
  id: string;
  source: "projects" | "context_projects";
  name: string;
  status: string;
}

export function emptyTeamMember(id = ""): TeamMember {
  return {
    id, name: "", role: "", status: null,
    responsibilities: "", autonomous_decisions: "", approval_required: "",
    project_ids: [], context_project_slugs: [],
    does: "", delegates: "", approves: "", monitors: "",
  };
}

export function isTeamMemberId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/i.test(id);
}

export function projectHref(project: TeamProject): string {
  return project.source === "projects"
    ? `/landing-pages/projects/${encodeURIComponent(project.id)}`
    : `/proyecto/${encodeURIComponent(project.id)}`;
}

export function memberProjects(member: TeamMember, projects: TeamProject[]) {
  return projects.filter((p) =>
    (p.source === "projects" ? member.project_ids : member.context_project_slugs).includes(p.id),
  );
}

export function isActiveProject(project: TeamProject) {
  return project.source === "projects"
    ? esProyectoActivo(project.status as EstadoProyecto)
    : ["activo", "bloqueado"].includes(project.status);
}

export function teamMetrics(members: TeamMember[], projects: TeamProject[]) {
  const linked = projects.filter((p) => members.some((m) => memberProjects(m, [p]).length));
  return {
    people: members.length,
    activeProjects: linked.length ? linked.filter(isActiveProject).length : null,
    blocked: members.some((m) => m.status !== null)
      ? members.filter((m) => m.status === "bloqueado").length : null,
    awaitingApproval: members.some((m) => m.status !== null)
      ? members.filter((m) => m.status === "esperando-aprobacion").length : null,
  };
}

/** Accept only editable fields; identity and server metadata cannot be changed. */
export function parseTeamUpdate(fd: FormData, member: TeamMember, projects: TeamProject[]) {
  const text = (key: string, limit: number) => {
    const raw = fd.get(key);
    if (raw !== null && typeof raw !== "string") throw new Error("El formulario contiene un valor inválido.");
    const value = (raw ?? "").trim();
    if (value.length > limit) throw new Error(`El campo ${key} supera el máximo de ${limit} caracteres.`);
    return value;
  };
  const name = text("name", 120);
  const role = text("role", 200);
  if (!name || !role) throw new Error("Es necesario completar el nombre y el rol.");
  const status = text("status", 40);
  if (status && !Object.hasOwn(TEAM_STATUSES, status)) throw new Error("El estado no es válido.");
  const references = (key: string, source: TeamProject["source"]) => {
    const values = fd.getAll(key);
    if (values.length > 500 || values.some((v) => typeof v !== "string" || !projects.some((p) => p.source === source && p.id === v))) {
      throw new Error("Algún proyecto ya no existe. Revisa la selección y guarda nuevamente.");
    }
    return [...new Set(values as string[])];
  };
  const update: Omit<TeamMember, "id"> = {
    name, role,
    status: (status || null) as TeamMember["status"],
    responsibilities: text("responsibilities", 10000),
    autonomous_decisions: text("autonomous_decisions", 10000),
    approval_required: text("approval_required", 10000),
    project_ids: references("project_ids", "projects"),
    context_project_slugs: references("context_project_slugs", "context_projects"),
    does: member.does, delegates: member.delegates,
    approves: member.approves, monitors: member.monitors,
  };
  if (member.id === "laureano") {
    for (const { key } of LEADERSHIP_FIELDS) update[key] = text(key, 10000);
  }
  return update;
}
