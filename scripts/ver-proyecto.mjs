/**
 * Read-only: prints a Landing Pages project with its stage and tasks.
 * Never prints credentials.
 *
 *   node scripts/ver-proyecto.mjs "tango porteño"
 */
import fs from "node:fs";

const ENV_FILES = [".env.local", "dashboard/.env.local"];

const envFile = ENV_FILES.find((f) => fs.existsSync(f));
if (!envFile) {
  console.error("No .env.local found.");
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

// Plain REST: supabase-js pulls in realtime, which needs WebSocket.
const API = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function get(query) {
  const res = await fetch(`${API}/${query}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

const search = process.argv[2];
if (!search) {
  console.error('Usage: node scripts/ver-proyecto.mjs "<name>"');
  process.exit(1);
}

const projects = await get(
  `projects?name=ilike.*${encodeURIComponent(search)}*&select=*`,
);

if (projects.length === 0) {
  console.log(`No project matches "${search}".`);
  process.exit(0);
}

for (const p of projects) {
  const tasks = await get(
    `tasks?project_id=eq.${p.id}&select=*&order=created_at.asc`,
  );
  console.log(JSON.stringify({ project: p, tasks }, null, 2));
}
