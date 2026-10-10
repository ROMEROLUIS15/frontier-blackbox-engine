/**
 * Smoke test against a deployed replica.
 * Usage: SMOKE_BASE_URL=https://<replica-host> TEAM_TOKEN=<team token> npm run smoke
 * The token is read from the environment and never printed. Exits 1 on the first failed check.
 */
import { isDeepStrictEqual } from "node:util";

const ORIGINAL_HOST = "caja-negra-production-c64f.up.railway.app";
const STEP_BUDGET_MS = 5000; // README.md:117

interface Check {
  name: string;
  method: "GET" | "POST";
  path: string;
  auth: boolean;
  body?: unknown;
  status: number;
  response: unknown;
}

const CHECKS: Check[] = [
  { name: "health without token", method: "GET", path: "/health", auth: false, status: 401, response: { error: "E001", mensaje: "no autorizado" } },
  { name: "health with token", method: "GET", path: "/health", auth: true, status: 200, response: { ok: true } },
  { name: "unknown route", method: "GET", path: "/no-such-route", auth: true, status: 404, response: { error: "E404", mensaje: "ruta desconocida" } },
  { name: "reset", method: "POST", path: "/__reset", auth: true, body: {}, status: 200, response: { ok: true } },
  { name: "PING", method: "POST", path: "/msg", auth: true, body: { m: "PING;64" }, status: 200, response: { pong: true } },
  { name: "ALTA", method: "POST", path: "/msg", auth: true, body: { m: "ALTA;Lucia;82" }, status: 201, response: { cuentaId: "AC-0001" } },
  { name: "CONSULTA", method: "POST", path: "/msg", auth: true, body: { m: "CONSULTA;AC-0001;14" }, status: 200, response: { cuenta_id: "AC-0001", saldo: 0 } },
  { name: "invalid control", method: "POST", path: "/msg", auth: true, body: { m: "ALTA;Lucia;83" }, status: 400, response: { error: "E202", mensaje: "control inválido" } },
  { name: "reset (leave clean)", method: "POST", path: "/__reset", auth: true, body: {}, status: 200, response: { ok: true } },
];

function readConfig(): { base: URL; token: string } | string {
  const rawBase = process.env["SMOKE_BASE_URL"];
  const token = process.env["TEAM_TOKEN"];
  if (rawBase === undefined || rawBase === "") return "SMOKE_BASE_URL is required";
  if (token === undefined || token === "") return "TEAM_TOKEN is required";
  let base: URL;
  try {
    base = new URL(rawBase);
  } catch {
    return "SMOKE_BASE_URL is not a valid URL";
  }
  if (base.host === ORIGINAL_HOST) return "refusing to run against the original service (README.md:125)";
  return { base, token };
}

async function run(): Promise<number> {
  const config = readConfig();
  if (typeof config === "string") {
    console.error(config);
    return 1;
  }
  console.log(`smoke target: ${config.base.origin}`);
  for (const check of CHECKS) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (check.auth) headers["authorization"] = `Bearer ${config.token}`;
    const started = performance.now();
    const res = await fetch(new URL(check.path, config.base), {
      method: check.method,
      headers,
      body: check.body === undefined ? undefined : JSON.stringify(check.body),
    });
    const text = await res.text();
    const ms = Math.round(performance.now() - started);
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep the raw text for the report
    }
    const ok = res.status === check.status && isDeepStrictEqual(body, check.response) && ms < STEP_BUDGET_MS;
    console.log(`${ok ? "PASS" : "FAIL"} ${check.name}: ${res.status} ${JSON.stringify(body)} ${ms}ms`);
    if (!ok) {
      console.error(`expected ${check.status} ${JSON.stringify(check.response)} in < ${STEP_BUDGET_MS}ms`);
      return 1;
    }
  }
  console.log(`smoke OK: ${CHECKS.length}/${CHECKS.length} checks`);
  return 0;
}

process.exitCode = await run();
