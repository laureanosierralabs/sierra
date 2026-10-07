import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../contexto/equipo.md", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const sql = readFileSync(new URL("../supabase/migrations/20261007120000_team_roles.sql", import.meta.url), "utf8");
const payload = JSON.parse(sql.match(/\$team_roles\$([\s\S]*?)\$team_roles\$::jsonb/)[1]);
const ids = ["bruno", "cielo", "jeremias", "laureano", "ulises"];
const allowed = ["role", "responsibilities", "autonomous_decisions", "approval_required", "does", "delegates", "approves", "monitors"];

test("role import targets exactly the five existing profiles with bounded editable fields", () => {
  assert.deepEqual(payload.map((p) => p.id).sort(), ids);
  for (const { before, after } of payload) {
    assert.deepEqual(Object.keys(before).sort(), Object.keys(after).sort());
    for (const [key, value] of Object.entries(after)) {
      assert.ok(allowed.includes(key));
      assert.equal(typeof value, "string");
      assert.ok(value.length <= (key === "role" ? 200 : 10000));
      assert.ok(!value.includes("\uFFFD"));
    }
  }
});

test("every supplied prose line is retained in editable profile fields", () => {
  const imported = payload.flatMap((p) => Object.values(p.after)).join("\n").replaceAll("**", "");
  for (const line of source.split("\n").map((value) => value.trim()).filter((value) => value && !value.startsWith("#") && value !== "---")) {
    assert.ok(imported.includes(line.replaceAll("**", "")), `Missing document content: ${line}`);
  }
  const laureano = payload.find((p) => p.id === "laureano");
  for (const title of ["ESTRUCTURA GENERAL", "REGLA GENERAL DE DELEGACIÓN", "FORMATO MÍNIMO PARA DELEGAR", "PRINCIPIO OPERATIVO"]) assert.ok(laureano.after.responsibilities.includes(`# ${title}`));
});

test("roles and dedicated decision fields follow the document without inventing assignments or states", () => {
  const roles = {
    laureano: "Founder / Dirección Comercial, Growth y Producto",
    bruno: "Responsable Operativo Web",
    cielo: "Responsable de Marca Personal y Contenido",
    jeremias: "Socio / Responsable Técnico y Delivery de Synous",
    ulises: "Operador Web Junior — Potencial incorporación / Stand by",
  };
  for (const { id, after } of payload) {
    assert.equal(after.role, roles[id]);
    for (const field of ["status", "project_ids", "context_project_slugs", "id", "name", "created_at"]) assert.equal(field in after, false);
    if (["laureano", "ulises"].includes(id)) {
      assert.equal("autonomous_decisions" in after, false);
      assert.equal("approval_required" in after, false);
    } else {
      assert.ok(after.autonomous_decisions);
      assert.ok(after.approval_required);
    }
  }
});

test("snapshot guard makes import replay-safe and preserves newer edits and unrelated fields", () => {
  assert.match(sql, /where member\.id = payload\.profile->>'id'\s+and to_jsonb\(member\) @> \(payload\.profile->'before'\)/);
  assert.doesNotMatch(sql, /\b(insert|upsert|delete|create table|alter table)\b/i);
  const apply = (current, item) => Object.entries(item.before).every(([key, value]) => current[key] === value) ? { ...current, ...item.after } : current;
  for (const item of payload) {
    const original = { id: item.id, ...item.before, status: "trabajando", project_ids: ["existing"], context_project_slugs: ["context"], name: "Existing name" };
    const imported = apply(original, item);
    assert.notEqual(imported, original);
    assert.equal(apply(imported, item), imported);
    assert.equal(imported.status, original.status);
    assert.deepEqual(imported.project_ids, original.project_ids);
    assert.deepEqual(imported.context_project_slugs, original.context_project_slugs);
    assert.equal(imported.name, original.name);
    const edited = { ...original, responsibilities: "A newer user note" };
    assert.equal(apply(edited, item), edited);
  }
});

test("Jeremías retains the source heading for joint decisions, not unilateral approval", () => {
  const profile = payload.find((item) => item.id === "jeremias");
  assert.ok(source.includes("## Necesita decidir con Laureano"));
  assert.ok(profile.after.approval_required.startsWith("## Necesita decidir con Laureano\n\n"));
  assert.equal(profile.before.approval_required, "");
});
