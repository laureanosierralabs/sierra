import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// Resolve the production extensionless TypeScript import with Node's native runner.
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === "./landing/tipos" ? "./landing/tipos.ts" : specifier, context);
} });
const { parseTeamUpdate, teamMetrics, isActiveProject, memberProjects, projectHref } = await import("../lib/team-fields.ts");

const member = {
  id: "laureano", name: "Laureano", role: "Dirección", status: null,
  responsibilities: "", autonomous_decisions: "", approval_required: "",
  project_ids: [], context_project_slugs: [],
  does: "Ventas", delegates: "Diseño", approves: "Entregables", monitors: "Costos",
};
const projects = [
  { id: "web-1", name: "Web", status: "en-progreso", source: "projects" },
  { id: "web-2", name: "Entregado", status: "entregado", source: "projects" },
  { id: "context-1", name: "Marca", status: "bloqueado", source: "context_projects" },
];
function form(values = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries({ name: "Laureano", role: "Dirección", ...values })) {
    for (const item of Array.isArray(value) ? value : [value]) fd.append(key, item);
  }
  return fd;
}

test("updates all editable fields together and clears nullable status and project links", () => {
  const update = parseTeamUpdate(form({
    name: " Lau ", role: " Producto ", responsibilities: "Ventas\nProducto",
    autonomous_decisions: "Pricing", approval_required: "", status: "",
    does: "Producto", delegates: "QA", approves: "Lanzamientos", monitors: "Margen",
  }), { ...member, status: "bloqueado", project_ids: ["web-1"] }, projects);
  assert.equal(update.name, "Lau");
  assert.equal(update.role, "Producto");
  assert.equal(update.responsibilities, "Ventas\nProducto");
  assert.equal(update.status, null);
  assert.deepEqual(update.project_ids, []);
  assert.equal(update.does, "Producto");
  assert.equal(update.delegates, "QA");
  assert.equal(update.approves, "Lanzamientos");
  assert.equal(update.monitors, "Margen");
  assert.equal("id" in update, false);
});

test("Laureano categories follow stable identity even after rename", () => {
  assert.equal(parseTeamUpdate(form({ does: "Ventas" }), { ...member, name: "Lau" }, projects).does, "Ventas");
  assert.equal(parseTeamUpdate(form({ does: "Injected" }), { ...member, id: "bruno" }, projects).does, "Ventas");
});

test("validates required fields, bounds and optional status", () => {
  assert.throws(() => parseTeamUpdate(form({ name: " " }), member, projects), /nombre y el rol/);
  assert.throws(() => parseTeamUpdate(form({ role: "" }), member, projects), /nombre y el rol/);
  assert.throws(() => parseTeamUpdate(form({ name: "x".repeat(121) }), member, projects), /máximo/);
  assert.throws(() => parseTeamUpdate(form({ responsibilities: "x".repeat(10001) }), member, projects), /máximo/);
  for (const status of ["disponible", "trabajando", "bloqueado", "esperando-aprobacion"]) {
    assert.equal(parseTeamUpdate(form({ status }), member, projects).status, status);
  }
  assert.throws(() => parseTeamUpdate(form({ status: "__proto__" }), member, projects), /estado no es válido/);
});

test("checks project references against the correct catalog, rejects deleted projects and deduplicates", () => {
  const update = parseTeamUpdate(form({ project_ids: ["web-1", "web-1"], context_project_slugs: ["context-1"] }), member, projects);
  assert.deepEqual(update.project_ids, ["web-1"]);
  assert.deepEqual(update.context_project_slugs, ["context-1"]);
  assert.throws(() => parseTeamUpdate(form({ project_ids: ["context-1"] }), member, projects), /ya no existe/);
  assert.throws(() => parseTeamUpdate(form({ context_project_slugs: ["deleted"] }), member, projects), /ya no existe/);
});

test("unknown metrics stay hidden; shared active projects count once", () => {
  assert.deepEqual(teamMetrics([member], projects), { people: 1, activeProjects: null, blocked: null, awaitingApproval: null });
  const linked = { ...member, project_ids: ["web-1", "web-2"], context_project_slugs: ["context-1"] };
  assert.deepEqual(teamMetrics([{ ...linked, status: "bloqueado" }, { ...linked, id: "bruno", status: "esperando-aprobacion" }], projects), {
    people: 2, activeProjects: 2, blocked: 1, awaitingApproval: 1,
  });
  assert.equal(memberProjects(linked, projects).length, 3);
  assert.equal(isActiveProject(projects[1]), false);
  assert.equal(isActiveProject({ ...projects[0], status: "por-iniciar" }), true);
  assert.equal(isActiveProject({ ...projects[0], status: "stand-by" }), false);
  assert.equal(projectHref(projects[0]), "/landing-pages/projects/web-1");
  assert.equal(projectHref(projects[2]), "/proyecto/context-1");
});

test("migration seeds exactly five profiles without overriding edits and enables RLS", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261006120000_team_members.sql", import.meta.url), "utf8");
  assert.match(sql, /on conflict \(id\) do nothing/i);
  assert.match(sql, /enable row level security/i);
  for (const id of ["laureano", "bruno", "ulises", "cielo", "jeremias"]) assert.ok(sql.includes(`('${id}',`));
  assert.match(sql, /begin;[\s\S]*commit;/i);
});
