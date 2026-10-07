import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// Resolve the production extensionless TypeScript import with Node's native runner.
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === "./landing/tipos" ? "./landing/tipos.ts" : specifier, context);
} });
const { emptyTeamMember, isTeamMemberId, parseTeamUpdate, teamMetrics, isActiveProject, memberProjects, projectHref } = await import("../lib/team-fields.ts");

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

// Load the real Server Actions with only framework/data-access boundaries mocked.
const mockModules = {
  "next/cache": "export const revalidatePath = (...args) => globalThis.teamActionMocks.revalidatePath(...args);",
  "@/lib/landing/supabase": "export const supabaseAdmin = () => globalThis.teamActionMocks.supabaseAdmin();",
  "@/lib/team": ["requireTeamOwner", "getTeamMember", "getTeamProjects", "teamLoadError"].map((key) => `export const ${key} = (...args) => globalThis.teamActionMocks.${key}(...args);`).join("\n"),
};
registerHooks({ resolve(specifier, context, nextResolve) {
  if (mockModules[specifier]) return { url: `data:text/javascript,${encodeURIComponent(mockModules[specifier])}`, shortCircuit: true };
  if (specifier === "@/lib/team-fields") return { url: new URL("../lib/team-fields.ts", import.meta.url).href, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { createTeamMember, updateTeamMember, deleteTeamMember } = await import("../app/equipo/actions.ts");

function actionFixture({ owner = true, databaseError = null, catalogError = false } = {}) {
  const rows = new Map([[member.id, structuredClone(member)]]);
  const reads = [];
  const writes = [];
  const invalidated = [];
  globalThis.teamActionMocks = {
    requireTeamOwner: async () => owner,
    getTeamMember: async (id) => { reads.push(id); return rows.get(id) ?? null; },
    getTeamProjects: async () => { reads.push("projects"); if (catalogError) throw new Error("offline"); return projects; },
    teamLoadError: () => "Error de conexión.",
    revalidatePath: (path) => invalidated.push(path),
    supabaseAdmin: () => ({ from(table) {
      assert.equal(table, "team_members", "CRUD must never mutate a project or Clerk table");
      let operation, values, id;
      const query = {
        insert(profile) { operation = "insert"; values = profile; return query; },
        update(profile) { operation = "update"; values = profile; return query; },
        delete() { operation = "delete"; return query; },
        eq(column, value) { assert.equal(column, "id"); id = value; return query; },
        select(columns) { assert.equal(columns, "id"); return query; },
        async maybeSingle() {
          writes.push({ operation, values, id });
          if (databaseError) return { data: null, error: databaseError };
          if (operation === "insert") {
            assert.equal(rows.has(values.id), false, "insert must not replace an existing profile");
            rows.set(values.id, structuredClone(values));
            return { data: { id: values.id }, error: null };
          }
          if (!rows.has(id)) return { data: null, error: null };
          if (operation === "update") rows.set(id, { ...rows.get(id), ...values });
          else rows.delete(id);
          return { data: { id }, error: null };
        },
        single() { return query.maybeSingle(); },
      };
      return query;
    } }),
  };
  return { rows, reads, writes, invalidated };
}

test("every CRUD action denies non-owners before reads or writes", async () => {
  const fixture = actionFixture({ owner: false });
  for (const result of [await createTeamMember(form()), await updateTeamMember("laureano", form()), await deleteTeamMember("laureano")]) assert.match(result.error, /Sin acceso/);
  assert.deepEqual(fixture.reads, []);
  assert.deepEqual(fixture.writes, []);
  assert.deepEqual(fixture.invalidated, []);
});

test("create uses independent server UUIDs, accepts duplicate names, and persists the full profile", async () => {
  const fixture = actionFixture();
  const first = await createTeamMember(form({ id: "laureano", does: "Injected", project_ids: ["web-1"], context_project_slugs: ["context-1"], status: "trabajando", responsibilities: "Operaciones" }));
  const second = await createTeamMember(form());
  assert.match(first.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.id, "laureano");
  assert.equal(fixture.rows.get(first.id).does, "");
  assert.equal(fixture.rows.get(first.id).responsibilities, "Operaciones");
  assert.equal(fixture.rows.get(first.id).status, "trabajando");
  assert.deepEqual(fixture.rows.get(first.id).project_ids, ["web-1"]);
  assert.deepEqual(fixture.rows.get(first.id).context_project_slugs, ["context-1"]);
  assert.equal(fixture.rows.get("laureano").does, "Ventas");
  assert.deepEqual(fixture.invalidated.slice(0, 3), ["/equipo", `/equipo/${first.id}`, "/"]);
});

test("create validation and catalog failures do not write or invalidate", async () => {
  let fixture = actionFixture();
  assert.match((await createTeamMember(form({ role: "" }))).error, /nombre y el rol/);
  assert.match((await createTeamMember(form({ project_ids: ["deleted"] }))).error, /ya no existe/);
  assert.deepEqual(fixture.writes, []);
  assert.deepEqual(fixture.invalidated, []);
  fixture = actionFixture({ catalogError: true });
  assert.match((await createTeamMember(form())).error, /No se creó/);
  assert.deepEqual(fixture.writes, []);
});

test("update persists edits and stable Laureano categories in one row", async () => {
  const fixture = actionFixture();
  assert.deepEqual(await updateTeamMember("laureano", form({ name: "Lau", does: "Producto", status: "bloqueado" })), {});
  assert.equal(fixture.rows.get("laureano").name, "Lau");
  assert.equal(fixture.rows.get("laureano").does, "Producto");
  assert.equal(fixture.writes.length, 1);
  assert.deepEqual(fixture.invalidated, ["/equipo", "/equipo/laureano", "/"]);
});

test("delete affects only selected profile and rejects missing or invalid IDs", async () => {
  const fixture = actionFixture();
  for (const id of ["", " ", null, "../laureano"]) {
    assert.equal(isTeamMemberId(id), false);
    assert.match((await deleteTeamMember(id)).error, /identificador/);
    assert.match((await updateTeamMember(id, form())).error, /identificador/);
  }
  assert.deepEqual(fixture.writes, []);
  fixture.rows.set("bruno", { ...member, id: "bruno" });
  assert.deepEqual(await deleteTeamMember("bruno"), {});
  assert.equal(fixture.rows.has("bruno"), false);
  assert.equal(fixture.rows.has("laureano"), true);
  assert.deepEqual(fixture.invalidated, ["/equipo", "/equipo/bruno", "/"]);
  assert.match((await deleteTeamMember("bruno")).error, /ya no existe/);
  assert.match((await updateTeamMember("bruno", form())).error, /ya no existe/);
});

test("failed database mutations return visible errors without reporting success or invalidating", async () => {
  const fixture = actionFixture({ databaseError: { code: "offline" } });
  assert.match((await createTeamMember(form())).error, /No se creó/);
  assert.match((await updateTeamMember("laureano", form())).error, /no se guardaron/);
  assert.match((await deleteTeamMember("laureano")).error, /No se eliminó/);
  assert.equal(fixture.rows.size, 1);
  assert.deepEqual(fixture.invalidated, []);
});

test("overview, detail and create retain the same full-width page container", () => {
  for (const path of ["page.tsx", "[id]/page.tsx", "nuevo/page.tsx"]) {
    const source = readFileSync(new URL(`../app/equipo/${path}`, import.meta.url), "utf8");
    assert.ok(source.includes('className="w-full px-6 py-10 md:px-10"'));
    assert.doesNotMatch(source, /max-w-5xl/);
  }
  assert.equal(emptyTeamMember().id, "");
});
