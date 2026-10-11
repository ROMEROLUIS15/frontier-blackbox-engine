/**
 * Generates docs/experimentos.md from experimentos.jsonl.
 * Every line of the log is replayed against the replica (in-process, 127.0.0.1 only), grouped by `seq` with a
 * POST /__reset before each group, exactly like test/equivalence.test.ts. Nothing is sent to any other host.
 *
 * Usage: npm run docs:experiments            writes docs/experimentos.md
 *        npm run docs:experiments -- --check exits 1 when the file on disk differs from the generated text
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { controlDigit } from "../src/control/iso7064.ts";
import { createServer } from "../src/http/server.ts";
import { AUTH_FORMS, CATEGORIES, COMMANDS, CONTROL_DIGIT, ERRORS, KNOWN_ROUTES, README_FACTS, SHAPES } from "./guide-glossary.ts";
import type { CategoryInfo } from "./guide-glossary.ts";

const ROOT = join(import.meta.dirname, "..");
const LOG_PATH = join(ROOT, "experimentos.jsonl");
const GUIDE_PATH = join(ROOT, "docs", "experimentos.md");
const SPEC_PATH = join(ROOT, "docs", "specification.md");
const EXAMPLES_PATH = join(ROOT, "pruebas", "ejemplos.jsonl");

// Fixed local values: the replica runs only in this process; none of them is a real credential.
const LOCAL_TOKEN = "test-token";
const WRONG_TOKEN = "wrong-token";
const silentLogger = { info: () => {}, error: () => {} };

type Auth = "team" | "wrong" | "none" | "bearer-lower" | "no-scheme";
const AUTH_VALUES: readonly string[] = ["team", "wrong", "none", "bearer-lower", "no-scheme"];

function isAuth(value: unknown): value is Auth {
  return typeof value === "string" && AUTH_VALUES.includes(value);
}

interface Entry {
  id: number;
  seq: string;
  hipotesis: string;
  request: unknown;
  status: number;
  response: unknown;
  conclusion: string;
  version: "v1" | "v2";
  replayOf: number | null;
  method: string | null;
  path: string | null;
  auth: Auth | null;
}

interface Measured {
  status: number;
  text: string;
}

interface Row {
  entry: Entry;
  method: string;
  path: string;
  auth: Auth;
  inferredFrom: number | null;
  measured: Measured;
  matches: boolean;
}

function parseEntry(raw: unknown): Entry {
  if (typeof raw !== "object" || raw === null) throw new Error("log line is not an object");
  const field = (name: string): unknown => (name in raw ? Reflect.get(raw, name) : undefined);
  const id = field("id");
  const seq = field("seq");
  const hipotesis = field("hipotesis");
  const status = field("status");
  const conclusion = field("conclusion");
  const replayOf = field("replay_of");
  const method = field("method");
  const path = field("path");
  const auth = field("auth");
  if (typeof id !== "number" || typeof seq !== "string" || typeof hipotesis !== "string") throw new Error("bad log line");
  if (typeof status !== "number" || typeof conclusion !== "string") throw new Error(`bad log line ${id}`);
  return {
    id,
    seq,
    hipotesis,
    request: field("request"),
    status,
    response: field("response"),
    conclusion,
    version: field("version") === "v2" ? "v2" : "v1",
    replayOf: typeof replayOf === "number" ? replayOf : null,
    method: typeof method === "string" ? method : null,
    path: typeof path === "string" ? path : null,
    auth: isAuth(auth) ? auth : null,
  };
}

function readLog(): Entry[] {
  return readFileSync(LOG_PATH, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => parseEntry(JSON.parse(line)));
}

function authorizationFor(auth: Auth): Record<string, string> {
  if (auth === "team") return { authorization: `Bearer ${LOCAL_TOKEN}` };
  if (auth === "wrong") return { authorization: `Bearer ${WRONG_TOKEN}` };
  if (auth === "bearer-lower") return { authorization: `bearer ${LOCAL_TOKEN}` };
  if (auth === "no-scheme") return { authorization: LOCAL_TOKEN };
  return {};
}

function bodyFor(request: unknown): string | undefined {
  // A string is logged for a raw body (non-JSON); null means no body; anything else is parsed JSON.
  if (request === null || request === undefined) return undefined;
  return typeof request === "string" ? request : JSON.stringify(request);
}

async function send(base: string, method: string, path: string, auth: Auth, request: unknown): Promise<Measured> {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...authorizationFor(auth) },
    body: bodyFor(request),
  });
  return { status: res.status, text: await res.text() };
}

/** A logged string response (HEAD gives "") is compared as exact text; anything else as parsed JSON. */
function sameResponse(measured: Measured, entry: Entry): boolean {
  if (measured.status !== entry.status) return false;
  if (typeof entry.response === "string") return measured.text === entry.response;
  try {
    return JSON.stringify(JSON.parse(measured.text)) === JSON.stringify(entry.response);
  } catch {
    return false;
  }
}

/**
 * Lines X:1-X:6 predate the method/path/auth fields. Their request is the one repeated verbatim by the v2 replay
 * (`replay_of`), so the missing fields are taken from that replay and flagged as inferred.
 */
function resolveRequest(entry: Entry, log: readonly Entry[]): Pick<Row, "method" | "path" | "auth" | "inferredFrom"> {
  if (entry.method !== null && entry.path !== null && entry.auth !== null) {
    return { method: entry.method, path: entry.path, auth: entry.auth, inferredFrom: null };
  }
  const replay = log.find((e) => e.replayOf === entry.id);
  if (replay !== undefined && replay.method !== null && replay.path !== null && replay.auth !== null) {
    return { method: replay.method, path: replay.path, auth: replay.auth, inferredFrom: replay.id };
  }
  throw new Error(`X:${entry.id} has no method/path/auth and no replay to infer them from`);
}

async function replayAll(log: readonly Entry[]): Promise<Row[]> {
  const server = createServer(LOCAL_TOKEN, silentLogger);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("replica did not bind a TCP port");
  const base = `http://127.0.0.1:${address.port}`;
  const rows: Row[] = [];
  try {
    for (const seq of new Set(log.map((e) => e.seq))) {
      await send(base, "POST", "/__reset", "team", {});
      for (const entry of log.filter((e) => e.seq === seq)) {
        const request = resolveRequest(entry, log);
        const measured = await send(base, request.method, request.path, request.auth, entry.request);
        rows.push({ entry, ...request, measured, matches: sameResponse(measured, entry) });
      }
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  return rows.sort((a, b) => a.entry.id - b.entry.id);
}

// ---------------------------------------------------------------------------------------------------------
// Rendering

const LABELS = {
  change: "Cambio de versión probado",
  consequence: "Consecuencia de un cambio",
  v2Only: "Comportamiento de v2 sin línea base en v1",
  preparation: "Preparación",
  baseline: "Línea base v1",
  repetition: "Repetición en v2",
  observation: "Observación",
} as const;

function labelOf(entry: Entry): string {
  const c = entry.conclusion;
  if (c.startsWith("Consecuencia")) return LABELS.consequence;
  if (c.includes("CAMBIO 1") || c.includes("CAMBIO 2")) return LABELS.change;
  if (c.startsWith("Comportamiento de v2")) return LABELS.v2Only;
  if (c.startsWith("Preparación")) return LABELS.preparation;
  if (entry.version === "v1") return LABELS.baseline;
  if (entry.replayOf !== null && c.startsWith("Igual")) return LABELS.repetition;
  return LABELS.observation;
}

const ref = (id: number): string => `X:${id}`;
const range = (first: number, last: number): string => (first === last ? ref(first) : `${ref(first)}–${ref(last)}`);

function truncate(text: string, max: number): string {
  const flat = text.replaceAll("\n", " ");
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}

function tableCell(text: string): string {
  return text.replaceAll("|", "\\|");
}

/** Short description of the request: the message `m` when there is one, otherwise the raw body or nothing. */
function requestSummary(request: unknown): string | null {
  if (request === null || request === undefined) return null;
  if (typeof request === "string") return request;
  if (typeof request === "object" && "m" in request && typeof request.m === "string") return request.m;
  return JSON.stringify(request);
}

function titleOf(row: Row): string {
  const summary = requestSummary(row.entry.request);
  const head = `${row.method} ${row.path}`;
  return summary === null || row.path !== "/msg" ? head : `${head} ${truncate(summary, 70)}`;
}

function shellQuote(text: string): string {
  return `'${text.replaceAll("'", "'\\''")}'`;
}

function curlFor(row: Row): string {
  const parts = ["curl -sS -i"];
  parts.push(row.method === "HEAD" ? "--head" : `-X ${row.method}`);
  parts.push(`"$BASE_URL${row.path}"`);
  if (row.auth === "team") parts.push(`-H "Authorization: Bearer $TEAM_TOKEN"`);
  else if (row.auth === "wrong") parts.push(`-H "Authorization: Bearer ${WRONG_TOKEN}"`);
  else if (row.auth === "bearer-lower") parts.push(`-H "Authorization: bearer $TEAM_TOKEN"`);
  else if (row.auth === "no-scheme") parts.push(`-H "Authorization: $TEAM_TOKEN"`);
  const body = bodyFor(row.entry.request);
  if (body !== undefined) {
    parts.push(`-H "Content-Type: application/json"`);
    parts.push(`--data-raw ${shellQuote(body)}`);
  }
  return parts.join(" \\\n  ");
}

function renderBody(value: unknown): string {
  if (typeof value === "string") return value === "" ? "(cuerpo vacío)" : value;
  return JSON.stringify(value);
}

function renderMeasured(measured: Measured): string {
  if (measured.text === "") return "(cuerpo vacío)";
  try {
    return JSON.stringify(JSON.parse(measured.text));
  } catch {
    return measured.text;
  }
}

function fenced(text: string, language = ""): string[] {
  return ["```" + language, text, "```"];
}

// ---------------------------------------------------------------------------------------------------------
// Specification, official examples and state reconstruction

interface SpecRef {
  id: string;
  confidence: string;
}

interface Spec {
  rowIds: ReadonlySet<string>;
  rowText: ReadonlyMap<string, string>;
  citedBy: ReadonlyMap<number, readonly SpecRef[]>;
}

interface Example {
  n: number;
  request: unknown;
  status: number;
  response: unknown;
}

const SPEC_ROW_ID = /^(?:(?:ENT|INT|CMD|MEM|ORD|CAM|OBS|RIE|ERR)-\d+[a-z]?)$/;
const SPEC_CITATION = /X:(\d+)(?:\s*[–-]\s*X:(\d+))?/g;

/** Reads docs/specification.md: the set of row ids and, for each log line, the rows whose evidence cites it. */
function loadSpec(): Spec {
  const rowIds = new Set<string>();
  const rowText = new Map<string, string>();
  const citedBy = new Map<number, SpecRef[]>();
  for (const line of readFileSync(SPEC_PATH, "utf8").split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const id = cells[0] ?? "";
    if (!SPEC_ROW_ID.test(id)) continue;
    rowIds.add(id);
    rowText.set(id, line);
    const evidence = cells[cells.length - 2] ?? "";
    const confidence = cells[cells.length - 1] ?? "";
    for (const match of evidence.matchAll(SPEC_CITATION)) {
      const first = Number(match[1]);
      const last = match[2] === undefined ? first : Number(match[2]);
      for (let n = first; n <= Math.max(first, last); n += 1) {
        const refs = citedBy.get(n) ?? [];
        if (!refs.some((r) => r.id === id)) citedBy.set(n, [...refs, { id, confidence }]);
      }
    }
  }
  return { rowIds, rowText, citedBy };
}

/** Fails when the glossary cites a specification row that does not exist. */
function assertGlossaryCitations(spec: Spec): void {
  const cited = [
    ...COMMANDS.flatMap((c) => c.cite),
    ...ERRORS.flatMap((e) => [e.row, ...e.cite]),
    ...SHAPES.flatMap((s) => s.cite),
    ...CONTROL_DIGIT.cite,
    ...Object.values(AUTH_FORMS).flatMap((a) => a.cite),
  ];
  const missing = cited.filter((id) => !spec.rowIds.has(id));
  if (missing.length > 0) throw new Error(`glossary cites unknown specification rows: ${[...new Set(missing)].join(", ")}`);
  const mismatched = ERRORS.filter((e) => !(spec.rowText.get(e.row) ?? "").includes(`\`${e.code}\``));
  if (mismatched.length > 0) throw new Error(`specification rows do not mention their error code: ${mismatched.map((e) => `${e.code}/${e.row}`).join(", ")}`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return Object.fromEntries(Object.entries(value));
}

function loadExamples(): Example[] {
  return readFileSync(EXAMPLES_PATH, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const raw = asRecord(JSON.parse(line));
      const n = raw?.["n"];
      const status = raw?.["status"];
      if (raw === null || typeof n !== "number" || typeof status !== "number") throw new Error("bad example line");
      return { n, request: raw["request"], status, response: raw["response"] };
    });
}

/** The message `m` of a logged request, when the body is a JSON object whose `m` is a string. */
function messageOf(request: unknown): string | null {
  const body = asRecord(request);
  const m = body?.["m"];
  return typeof m === "string" ? m : null;
}

interface Account {
  name: string;
  balance: number | null;
}

interface Operation {
  kind: "DEPOSITO" | "TRANSFER";
  from: string | null;
  to: string;
  amount: number | null;
  annulled: boolean;
}

interface SimState {
  accounts: Map<string, Account>;
  ops: Map<string, Operation>;
}

const toAmount = (text: string | undefined): number | null => (text !== undefined && /^\d+$/.test(text) ? Number(text) : null);
const balanceText = (balance: number | null): string => (balance === null ? "saldo no observado" : `saldo ${balance}`);

function describeState(state: SimState): string {
  if (state.accounts.size === 0 && state.ops.size === 0) return "sin cuentas ni operaciones";
  const accounts = [...state.accounts].map(([id, a]) => `${id} («${a.name}», ${balanceText(a.balance)})`);
  const ops = [...state.ops].map(([id, o]) => {
    const amount = o.amount === null ? "monto no interpretado" : String(o.amount);
    const what = o.kind === "DEPOSITO" ? `depósito de ${amount} en ${o.to}` : `transferencia de ${amount} de ${o.from ?? "?"} a ${o.to}`;
    return `${id} (${what}${o.annulled ? ", anulada" : ""})`;
  });
  const parts = [];
  if (accounts.length > 0) parts.push(`cuentas: ${accounts.join("; ")}`);
  if (ops.length > 0) parts.push(`operaciones: ${ops.join("; ")}`);
  return parts.join(". ");
}

function addToBalance(account: Account | undefined, delta: number | null): void {
  if (account === undefined) return;
  account.balance = account.balance === null || delta === null ? null : account.balance + delta;
}

/** Applies one accepted line to the reconstructed state using the ORIGINAL's logged response; returns its effect. */
function applyStep(state: SimState, row: Row): string {
  const { entry } = row;
  const message = messageOf(entry.request);
  const body = asRecord(entry.response);
  if (row.method === "POST" && row.path === "/__reset") {
    state.accounts.clear();
    state.ops.clear();
    return "vuelve el estado al inicial: borra cuentas, operaciones y contadores (MEM-01).";
  }
  if (row.method !== "POST" || row.path !== "/msg" || message === null) {
    return "no es un mensaje de `POST /msg`: no modifica cuentas ni operaciones.";
  }
  if (entry.status >= 400) {
    const code = body?.["error"];
    return `rechazada${typeof code === "string" ? ` con ${code}` : ""}: no modifica el estado y no consume número de cuenta ni de operación (MEM-02).`;
  }
  const fields = message.split(";");
  const command = (fields[0] ?? "").toUpperCase();
  const operationId = body?.["operacionId"];
  if (command === "ALTA" && typeof body?.["cuentaId"] === "string") {
    state.accounts.set(body["cuentaId"], { name: fields[1] ?? "", balance: 0 });
    return `crea la cuenta ${body["cuentaId"]} («${fields[1] ?? ""}») con saldo 0 (CMD-02).`;
  }
  if (command === "DEPOSITO" && typeof operationId === "string") {
    const amount = toAmount(fields[2]);
    const account = state.accounts.get(fields[1] ?? "");
    addToBalance(account, amount);
    state.ops.set(operationId, { kind: "DEPOSITO", from: null, to: fields[1] ?? "", amount, annulled: false });
    return `registra ${operationId}: suma ${amount ?? "un monto no interpretado"} a ${fields[1] ?? ""}${account === undefined ? "" : `, que queda con ${balanceText(account.balance)}`} (CMD-06).`;
  }
  if (command === "TRANSFER" && typeof operationId === "string") {
    const amount = toAmount(fields[3]);
    const source = state.accounts.get(fields[1] ?? "");
    const target = state.accounts.get(fields[2] ?? "");
    addToBalance(source, amount === null ? null : -amount);
    addToBalance(target, amount);
    state.ops.set(operationId, { kind: "TRANSFER", from: fields[1] ?? "", to: fields[2] ?? "", amount, annulled: false });
    return `registra ${operationId}: mueve ${amount ?? "un monto no interpretado"} de ${fields[1] ?? ""} (${balanceText(source?.balance ?? null)}) a ${fields[2] ?? ""} (${balanceText(target?.balance ?? null)}) (CMD-09).`;
  }
  if (command === "ANULA" && body?.["ok"] === true && typeof body["anulada"] === "string") {
    const op = state.ops.get(body["anulada"]);
    if (op === undefined) return `anula ${body["anulada"]}, que no fue creada en esta secuencia: efecto en los saldos no observado.`;
    op.annulled = true;
    if (op.kind === "DEPOSITO") {
      addToBalance(state.accounts.get(op.to), op.amount === null ? null : -op.amount);
    } else {
      addToBalance(state.accounts.get(op.from ?? ""), op.amount);
      addToBalance(state.accounts.get(op.to), op.amount === null ? null : -op.amount);
    }
    return `anula ${body["anulada"]} y revierte su efecto en los saldos (CMD-17, CMD-18, CMD-18b).`;
  }
  if (command === "ANULA" && body?.["ok"] === false) return "la operación ya estaba anulada: no modifica el estado (CMD-15).";
  if (command === "CONSULTA" && body !== null && "saldo" in body) {
    const saldo = body["saldo"];
    const observed = typeof saldo === "number" ? saldo : typeof saldo === "string" ? Number(saldo.replace(".", "")) : Number.NaN;
    const account = state.accounts.get(fields[1] ?? "");
    if (account !== undefined && Number.isFinite(observed)) {
      const previous = account.balance;
      account.balance = observed;
      const note = previous !== null && previous !== observed ? ` (el saldo reconstruido era ${previous})` : "";
      return `no modifica el estado; observa que ${fields[1] ?? ""} tiene saldo ${observed} (centavos, CMD-04)${note}.`;
    }
    return "no modifica el estado.";
  }
  if (command === "PING") return "no modifica el estado (CMD-01).";
  return "sin efecto reconocido en el estado.";
}

interface StepState {
  before: string;
  effect: string;
}

/** For every line, the state before it and the effect it had, reconstructed per sequence from the original's logs. */
function reconstructStates(groups: readonly SeqInfo[]): Map<number, StepState> {
  const steps = new Map<number, StepState>();
  for (const group of groups) {
    const state: SimState = { accounts: new Map(), ops: new Map() };
    for (const row of group.rows) {
      const before = describeState(state);
      steps.set(row.entry.id, { before, effect: applyStep(state, row) });
    }
  }
  return steps;
}

// ---------------------------------------------------------------------------------------------------------
// Request and response explanations

function splitMessage(message: string): { command: string; args: string[]; control: string; payload: string } | null {
  const fields = message.split(";");
  if (fields.length < 2) return null;
  const control = fields[fields.length - 1] ?? "";
  return { command: fields[0] ?? "", args: fields.slice(1, -1), control, payload: fields.slice(0, -1).join(";") };
}

const cites = (ids: readonly string[]): string => (ids.length === 0 ? "" : ` (${ids.join(", ")})`);

function describeRoute(row: Row): string {
  const route = `${row.method} ${row.path}`;
  if (KNOWN_ROUTES.includes(route)) {
    if (row.path === "/msg") return `\`${route}\` es la ruta de los mensajes (ENT-01).`;
    if (row.path === "/health") return `\`${route}\` es una ruta conocida (ENT-01); exige token (ENT-06).`;
    return `\`${route}\` es una ruta conocida (ENT-01) que vuelve el estado al inicial (MEM-01).`;
  }
  const knownPath = KNOWN_ROUTES.some((r) => r.endsWith(` ${row.path}`));
  if (knownPath) return `\`${route}\` usa un método que no admite esa ruta conocida (ENT-03 nombra GET, PUT y DELETE sobre \`/msg\`).`;
  return `\`${route}\` no es una de las rutas conocidas (ENT-01), que son ${KNOWN_ROUTES.map((r) => `\`${r}\``).join(", ")} (ENT-02).`;
}

function describeControl(parts: NonNullable<ReturnType<typeof splitMessage>>): string[] {
  const lines: string[] = [CONTROL_DIGIT.text];
  if (parts.payload === "") {
    lines.push("El payload es vacío, así que no hay un control que calcular.");
    return lines;
  }
  const valid = controlDigit(parts.payload);
  lines.push(
    `Para el payload \`${parts.payload}\` el cálculo da \`${valid}\`; el control enviado es \`${parts.control}\`, que ${parts.control === String(valid) ? "coincide con ese valor" : "no coincide con ese valor"}.`,
  );
  if (parts.command.toUpperCase() === "PING") lines.push("`PING` ignora el control, pero valida la aridad (INT-09).");
  lines.push("El control detecta errores de tipeo; no autentica ni protege la integridad ante un atacante (RIE-03).");
  return lines;
}

function describeMessage(message: string): string[] {
  const parts = splitMessage(message);
  if (parts === null) return [`El mensaje \`${message}\` no contiene ningún \`;\`, por lo que no tiene campo de control (INT-07).`];
  const info = COMMANDS.find((c) => c.name === parts.command.toUpperCase());
  const args = parts.args.length === 0 ? "ninguno" : parts.args.map((a, i) => `${info?.args[i] ?? `argumento ${i + 1}`}=${a === "" ? "(vacío)" : `\`${a}\``}`).join(", ");
  const lines = [
    `El mensaje \`m\` se divide por \`;\` en ${parts.args.length + 2} campos (INT-01): comando \`${parts.command}\`, argumentos: ${args}; control \`${parts.control}\`.`,
  ];
  if (info === undefined) {
    lines.push(`\`${parts.command}\` no es uno de los comandos conocidos (${COMMANDS.map((c) => `\`${c.name}\``).join(", ")}); ver CMD-19.`);
  } else {
    const arity = info.args.length === 0 ? "sin argumentos" : `${info.args.length} argumento(s): ${info.args.join(", ")}`;
    lines.push(`\`${info.name}\` ${info.meaning}${cites(info.cite)}. Aridad: ${arity}${parts.args.length === info.args.length ? "" : `; esta solicitud envía ${parts.args.length}`}.`);
  }
  const empties = [parts.command, ...parts.args, parts.control].filter((field) => field === "").length;
  if (empties > 0) lines.push(`Contiene ${empties} segmento(s) vacío(s) (INT-10).`);
  lines.push(...describeControl(parts));
  return lines;
}

function describeBody(row: Row): string[] {
  const request = row.entry.request;
  if (request === null || request === undefined) return ["No lleva cuerpo."];
  if (typeof request === "string") return [`El cuerpo se envía tal cual, como texto: \`${request}\` (ver ENT-08 para el caso de un cuerpo que no es JSON).`];
  const message = messageOf(request);
  if (message !== null) return describeMessage(message);
  if (Array.isArray(request)) return ["El cuerpo es un arreglo JSON, no un objeto con el campo `m` (ENT-11)."];
  return [`El cuerpo es el JSON \`${JSON.stringify(request)}\`, que no trae un campo \`m\` de tipo string (ENT-09).`];
}

function describeRequest(row: Row): string[] {
  const auth = AUTH_FORMS[row.auth];
  const lines = [describeRoute(row), `Autenticación: ${auth?.text ?? row.auth}${cites(auth?.cite ?? [])}.`];
  if (row.inferredFrom !== null) {
    lines.push(`Esta línea no registra método, ruta ni autenticación: se infieren de ${ref(row.inferredFrom)}, su repetición en v2.`);
  }
  return [...lines, ...describeBody(row)];
}

function describeResponse(row: Row): string {
  const { entry } = row;
  const body = entry.response;
  if (typeof body === "string") return body === "" ? "El cuerpo está vacío." : "El cuerpo no es JSON.";
  const record = asRecord(body);
  if (record === null) return "El cuerpo JSON no es un objeto; el glosario no lo describe.";
  const code = record["error"];
  if (typeof code === "string") {
    const info = ERRORS.find((e) => e.code === code);
    if (info === undefined) return `Error ${code}: no figura en el glosario.`;
    const hint = typeof record["sugerencia"] === "string" ? ` El campo \`sugerencia\` nombra el comando conocido más cercano (OBS-05).` : "";
    return `Error ${code} (HTTP ${entry.status}): el servicio responde «${info.mensaje}». Según la especificación se produce cuando ${info.rule}${cites([info.row, ...info.cite])}.${hint}`;
  }
  const keys = Object.keys(record).sort().join(",");
  const shape = SHAPES.find((s) => s.keys === keys);
  return shape === undefined ? `Respuesta con las claves ${keys}: el glosario no la describe.` : `${shape.meaning[0]?.toUpperCase() ?? ""}${shape.meaning.slice(1)}${cites(shape.cite)}.`;
}

function responseIsDescribed(row: Row): boolean {
  const body = row.entry.response;
  if (typeof body === "string") return body === "";
  const record = asRecord(body);
  if (record === null) return false;
  const code = record["error"];
  if (typeof code === "string") return ERRORS.some((e) => e.code === code);
  return SHAPES.some((s) => s.keys === Object.keys(record).sort().join(","));
}

// ---------------------------------------------------------------------------------------------------------
// Categories, relations and conclusion

function stemOf(seq: string): string | null {
  return /^s-(?:v2-)?([a-z0-9]+)-[a-z0-9]+(?:-v2)?$/.exec(seq)?.[1] ?? null;
}

function categoryOf(entry: Entry): CategoryInfo | undefined {
  const key =
    entry.hipotesis.startsWith("Preparación") || entry.conclusion.startsWith("Preparación") || entry.path === "/__reset"
      ? "preparation"
      : entry.replayOf !== null
        ? "replay"
        : null;
  if (key !== null) return CATEGORIES.find((c) => c.key === key);
  const stem = stemOf(entry.seq);
  return stem === null ? undefined : CATEGORIES.find((c) => c.stems.includes(stem));
}

interface Context {
  rows: readonly Row[];
  byId: ReadonlyMap<number, Row>;
  spec: Spec;
  examples: readonly Example[];
  steps: ReadonlyMap<number, StepState>;
}

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

function citeList(ids: readonly number[], limit = 8): string {
  const shown = ids.slice(0, limit).map(ref).join(", ");
  return ids.length > limit ? `${shown} y ${ids.length - limit} más` : shown;
}

/** The v1 line and its v2 replay for a line that belongs to such a pair, if any. */
function pairOf(row: Row, ctx: Context): { v1: Row; v2: Row; differs: boolean } | null {
  const v1 = row.entry.replayOf !== null ? ctx.byId.get(row.entry.replayOf) : row;
  const v2 = row.entry.replayOf !== null ? row : ctx.rows.find((r) => r.entry.replayOf === row.entry.id);
  if (v1 === undefined || v2 === undefined) return null;
  return { v1, v2, differs: v1.entry.status !== v2.entry.status || !sameJson(v1.entry.response, v2.entry.response) };
}

interface Relations {
  lines: string[];
  hasAny: boolean;
}

function relationsOf(row: Row, ctx: Context): Relations {
  const { entry } = row;
  const lines: string[] = [];
  const specRefs = ctx.spec.citedBy.get(entry.id) ?? [];
  lines.push(
    specRefs.length > 0
      ? `- Especificación: la citan las filas ${specRefs.map((r) => `${r.id} (${r.confidence})`).join(", ")}.`
      : "- Especificación: ninguna fila de `docs/specification.md` cita esta línea.",
  );
  const pair = pairOf(row, ctx);
  if (pair !== null) {
    lines.push(
      `- Par v1/v2: ${ref(pair.v1.entry.id)} (v1) y ${ref(pair.v2.entry.id)} (v2, \`replay_of\`); ${pair.differs ? "las respuestas registradas del original difieren" : "las respuestas registradas del original son iguales"}.`,
    );
  } else if (entry.version === "v1") {
    lines.push("- Par v1/v2: esta línea de v1 no tiene repetición en v2.");
  }
  const message = messageOf(entry.request);
  const others = message === null ? [] : ctx.rows.filter((r) => r.entry.id !== entry.id && messageOf(r.entry.request) === message).map((r) => r.entry);
  const partner = pair === null ? null : pair.v1.entry.id === entry.id ? pair.v2.entry.id : pair.v1.entry.id;
  const sameV1 = others.filter((e) => e.version === "v1" && e.id !== partner).map((e) => e.id);
  const sameV2 = others.filter((e) => e.version === "v2" && e.id !== partner).map((e) => e.id);
  if (sameV1.length + sameV2.length > 0) {
    const parts = [];
    if (sameV1.length > 0) parts.push(`v1: ${citeList(sameV1)}`);
    if (sameV2.length > 0) parts.push(`v2: ${citeList(sameV2)}`);
    lines.push(`- Mismo mensaje \`m\` en otras líneas de nuestros experimentos (${parts.join("; ")}).`);
  }
  const examples = ctx.examples.filter((x) => sameJson(x.request, entry.request));
  for (const example of examples) {
    const source = `Ejemplo oficial E:${example.n} (\`pruebas/ejemplos.jsonl\`, grabado por los autores del reto con la versión de la mañana)`;
    const differences = [
      row.auth === "team" ? null : "otra autenticación",
      row.path === "/msg" ? null : "otra ruta",
      row.method === "POST" ? null : "otro método",
    ].filter((d): d is string => d !== null);
    if (differences.length > 0) {
      lines.push(
        `- ${source}: mismo mensaje \`m\`, pero con ${differences.join(" y ")} (los ejemplos oficiales son \`POST /msg\` con el token del equipo); las respuestas no son comparables directamente.`,
      );
    } else {
      const agrees = example.status === entry.status && sameJson(example.response, entry.response);
      lines.push(
        `- ${source}: misma solicitud (método, ruta, autenticación y cuerpo); su respuesta oficial ${agrees ? "coincide con" : "difiere de"} la registrada en esta línea.`,
      );
    }
  }
  return { lines, hasAny: specRefs.length > 0 || pair !== null || sameV1.length + sameV2.length > 0 || examples.length > 0 };
}

function describeConclusion(row: Row, ctx: Context): { lines: string[]; limitation: string | null } {
  const { entry } = row;
  const label = labelOf(entry);
  const pair = pairOf(row, ctx);
  const cited = [...entry.conclusion.matchAll(/X:(\d+)/g)].map((m) => Number(m[1]));
  const lines = [
    `Evidencia: el original (${entry.version}) respondió status ${entry.status} con el cuerpo mostrado arriba; es lo único observado directamente.`,
    `Conclusión registrada en el log (interpretación nuestra): «${entry.conclusion}»`,
    `Etiqueta: **${label}**.`,
  ];
  let limitation: string | null = null;
  if (label === LABELS.change) {
    if (pair !== null) {
      lines.push(
        pair.differs
          ? `Es un cambio de versión probado por el par ${ref(pair.v1.entry.id)} (v1: status ${pair.v1.entry.status}) y ${ref(pair.v2.entry.id)} (v2: status ${pair.v2.entry.status}): la misma solicitud recibió respuestas distintas.`
          : `La conclusión habla de un cambio, pero el par ${ref(pair.v1.entry.id)} / ${ref(pair.v2.entry.id)} registra respuestas iguales.`,
      );
    } else if (cited.length > 0) {
      lines.push(`La conclusión habla de un cambio; esta línea no tiene par v1/v2 propio y remite a ${citeList(cited)}. Lo probado es el par citado, no esta línea por sí sola.`);
    } else {
      limitation = "la conclusión habla de un cambio de versión, pero esta línea no tiene par v1/v2 ni cita otra línea: el registro no permite verificar el par.";
    }
  } else if (label === LABELS.consequence) {
    lines.push(`Se deduce de un cambio probado${cited.length > 0 ? ` (líneas citadas: ${citeList(cited)})` : ""}; no es una prueba independiente.`);
  } else if (label === LABELS.v2Only) {
    lines.push("Se observó en v2 y no existe una solicitud equivalente en v1, así que no está probado como cambio de versión (especificación, sección 6.2); queda como comportamiento observado.");
  } else if (label === LABELS.preparation) {
    lines.push("Es un paso de preparación: no pone a prueba una hipótesis, solo deja el estado para las líneas siguientes.");
  } else if (label === LABELS.baseline) {
    lines.push(
      pair === null
        ? "Es una observación de v1 y no tiene repetición en v2: no permite afirmar cuál es el comportamiento vigente en v2."
        : `Es la base de comparación de v1; su repetición en v2 es ${ref(pair.v2.entry.id)}${pair.differs ? ", donde la respuesta cambió" : ", donde la respuesta es la misma"}.`,
    );
  } else if (label === LABELS.repetition) {
    lines.push(`Repite ${pair === null ? "una línea de v1" : ref(pair.v1.entry.id)} y registra la misma respuesta: v2 no cambió este comportamiento.`);
  } else {
    lines.push("Es una observación puntual: la evidencia es el status y el cuerpo; cualquier generalización que haga la conclusión es inferencia.");
  }
  if (entry.version === "v2" && row.matches && /réplica/i.test(entry.conclusion)) {
    lines.push("La conclusión registrada habla de la réplica tal como estaba cuando se hizo el experimento; al generar este documento la réplica coincide con el original en esta línea.");
  }
  if (/inferid|supuest/i.test(entry.conclusion)) lines.push("El texto registrado marca parte de la conclusión como inferida o supuesta: esa parte sigue siendo hipótesis.");
  return { lines, limitation };
}

// ---------------------------------------------------------------------------------------------------------
// Document sections

interface SeqInfo {
  seq: string;
  first: Entry;
  last: Entry;
  rows: Row[];
}

function groupBySeq(rows: readonly Row[]): SeqInfo[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) groups.set(row.entry.seq, [...(groups.get(row.entry.seq) ?? []), row]);
  return [...groups].map(([seq, list]) => {
    const first = list[0];
    const last = list[list.length - 1];
    if (first === undefined || last === undefined) throw new Error(`empty sequence ${seq}`);
    return { seq, first: first.entry, last: last.entry, rows: list };
  });
}

function renderIntro(): string[] {
  return [
    "# Guía de experimentos — servicio \"La caja negra\" (Reto 2)",
    "",
    "> Documento generado por `scripts/experiment-guide.ts` a partir de `experimentos.jsonl`. No se edita a mano:",
    "> cualquier cambio se hace en el log, en el glosario (`scripts/guide-glossary.ts`) o en el generador, y se regenera.",
    "",
    "## Propósito y cómo leer cada entrada",
    "",
    "Esta guía explica, solicitud por solicitud, los experimentos que se hicieron contra el servicio original para",
    "reconstruir su comportamiento sin acceso a su código. Está pensada para quien no participó en ellos: cada entrada",
    "dice qué se quería saber, en qué estado se hizo la prueba, qué hace la solicitud, qué respondió el original, qué",
    "responde la réplica y qué se puede concluir.",
    "",
    "**Dos numeraciones distintas.** No deben mezclarse:",
    "",
    "- `X:n` es la línea `id` n de `experimentos.jsonl`: **nuestros experimentos**, hechos contra el original.",
    `- \`E:n\` es la línea \`n\` de \`pruebas/ejemplos.jsonl\`: los **20 ejemplos oficiales** grabados por los autores del reto (${README_FACTS.examplesMorning}). Solo aparecen como referencia cruzada cuando un experimento envía exactamente la misma solicitud.`,
    "",
    "Cada entrada tiene siete apartados:",
    "",
    "1. **Qué se quería saber y por qué importa:** la hipótesis registrada, tal cual, y la categoría de la prueba.",
    "2. **Estado previo y cómo se construye:** el `POST /__reset` que abre la secuencia, las solicitudes previas y el estado que dejan.",
    "3. **Qué hace la solicitud:** ruta, autenticación y cuerpo explicados (el mensaje `m` dividido en comando, argumentos y control), con el `curl` para repetirla.",
    "4. **Respuesta observada del original:** status y cuerpo registrados, con su significado.",
    "5. **Respuesta de la réplica:** status y cuerpo medidos al generar este documento y si coinciden.",
    "6. **Qué permite concluir y qué sigue siendo hipótesis:** la evidencia (status + cuerpo) separada de la conclusión registrada, que es nuestra interpretación.",
    "7. **Relación con otros experimentos y con la especificación:** filas de `docs/specification.md` que citan la línea, pares v1/v2, mensajes idénticos y ejemplos oficiales.",
    "",
    "Cuando el registro no alcanza para explicar algo, la entrada lo dice en una línea **Limitación**; no se rellena con suposiciones.",
    "",
    "## Qué es evidencia y qué es explicación",
    "",
    "- Son **datos**: lo registrado en `experimentos.jsonl` (solicitud, status, cuerpo, hipótesis, conclusión) y lo medido en la réplica al generar el documento.",
    "- Es **glosario estático**: las frases de la sección «Glosario», cada una con la fila de `docs/specification.md` o la línea de `README.md` que la respalda. El generador falla si una fila citada no existe.",
    "- Es **reconstrucción**: el estado previo se calcula a partir de las respuestas registradas del original; los saldos solo se muestran cuando se siguen de operaciones aceptadas o de una `CONSULTA`.",
    "- La **hipótesis** es la pregunta formulada antes de la solicitud; la **evidencia** es el par status + cuerpo; la **conclusión** es la interpretación anotada en el log y puede ir más allá de la evidencia.",
    "",
    "## Cómo regenerar el documento",
    "",
    "```bash",
    "npm run docs:experiments            # escribe docs/experimentos.md",
    "npm run docs:experiments -- --check # sale con código 1 si el archivo en disco está desactualizado",
    "```",
    "",
    "El generador levanta la réplica en el propio proceso (solo `127.0.0.1`, puerto efímero, token local fijo), reproduce",
    "todas las líneas del log agrupadas por `seq` y con `POST /__reset` antes de cada grupo, y escribe el resultado sin",
    "marcas de tiempo, de modo que la salida es determinista. No contacta con el servicio original ni con ningún otro host.",
    "",
    "## Cómo reproducir una solicitud a mano",
    "",
    "```bash",
    "export TEAM_TOKEN=<token del equipo>   # nunca se escribe en el repositorio",
    "export BASE_URL=<URL base>              # la del servicio original (mientras esté disponible) o la de la réplica",
    "```",
    "",
    "Ejecute en orden las solicitudes de la secuencia (empezando por `POST /__reset` con el token del equipo y cuerpo `{}`)",
    "hasta la entrada que quiera repetir. El log no registra la cabecera `Content-Type`; los comandos usan",
    "`application/json` cuando hay cuerpo. Las líneas X:1–X:6 no registran método, ruta ni autenticación: se toman de su",
    "repetición en v2 y se marcan como inferidas.",
    "",
  ];
}

function renderGlossary(): string[] {
  const lines = [
    "## Glosario",
    "",
    "Cada frase sigue a una fila de `docs/specification.md` (se cita su id) o a una línea de `README.md`. No se añade nada que esas fuentes no digan.",
    "",
    "### Mensaje y dígito de control",
    "",
    `- ${CONTROL_DIGIT.text} Fuente: ${CONTROL_DIGIT.cite.join(", ")}.`,
    "- Para comandos distintos de `PING` el control tiene 1 o 2 dígitos y se compara como texto exacto, no como número (INT-06, INT-06b). `PING` ignora el control (INT-09).",
    "- El nombre del comando no distingue mayúsculas (especificación, sección 3, nota inicial). La aridad es el número de campos entre el comando y el control (ídem).",
    "",
    "### Comandos",
    "",
    "| Comando | Argumentos | Qué hace | Fuente |",
    "|---|---|---|---|",
    ...COMMANDS.map((c) => `| \`${c.name}\` | ${c.args.length === 0 ? "—" : c.args.join(", ")} | ${c.meaning} | ${c.cite.join(", ")} |`),
    "",
    "### Códigos de error",
    "",
    "El texto de `mensaje` y el status son los de la sección 5 de la especificación; la columna «Se produce cuando» resume la fila citada.",
    "",
    "| Código | Status | `mensaje` | Se produce cuando | Fuente |",
    "|---|---|---|---|---|",
    ...ERRORS.map((e) => `| ${e.code} | ${e.status} | \`${e.mensaje}\` | ${e.rule} | ${e.row}; ${e.cite.join(", ")} |`),
    "",
    "### Formas de respuesta correcta",
    "",
    "| Claves del JSON | Significado | Fuente |",
    "|---|---|---|",
    ...SHAPES.map((s) => `| \`${s.keys}\` | ${s.meaning} | ${s.cite.join(", ")} |`),
    "",
    "### Autenticación y rutas",
    "",
    ...Object.entries(AUTH_FORMS).map(([key, a]) => `- \`auth: ${key}\`: ${a.text}${a.cite.length > 0 ? ` (${a.cite.join(", ")})` : "; la especificación no describe esta variante de la cabecera"}.`),
    `- Rutas conocidas: ${KNOWN_ROUTES.map((r) => `\`${r}\``).join(", ")} (ENT-01). El resto responde E404 (ENT-02, ENT-03).`,
    `- ${README_FACTS.serviceChanges}; por eso se comparan dos versiones.`,
    "",
    "### Categorías de prueba",
    "",
    "Cada entrada recibe una categoría de forma mecánica: «Preparación» si la hipótesis o la conclusión empiezan con esa palabra; «Repetición de v1 contra v2» si la línea tiene `replay_of`; en otro caso, la categoría de su secuencia según el nombre (`s-v2-lim-01` → `lim`). Si ninguna aplica, la entrada lo dice.",
    "",
    "| Categoría | Secuencias (nombre) | Por qué importa |",
    "|---|---|---|",
    ...CATEGORIES.map((c) => `| ${c.label} | ${c.stems.length === 0 ? "—" : c.stems.map((s) => `\`${s}\``).join(", ")} | ${tableCell(c.why)} |`),
    "",
  ];
  return lines;
}

function renderMethod(groups: readonly SeqInfo[], rows: readonly Row[]): string[] {
  const v1 = rows.filter((r) => r.entry.version === "v1");
  const v2 = rows.filter((r) => r.entry.version === "v2");
  const v1Last = v1[v1.length - 1]?.entry.id ?? 0;
  const v2First = v2[0]?.entry.id ?? 0;
  const replays = v2.filter((r) => r.entry.replayOf !== null);
  const replayFirst = replays[0]?.entry.id ?? 0;
  const replayLast = replays[replays.length - 1]?.entry.id ?? 0;
  const lines = [
    "## Método",
    "",
    `- **Versión 1** (campo \`version\` ausente): ${range(1, v1Last)}, ${v1.length} líneas.`,
    `- **Repetición de la versión 1 contra la versión 2** (campo \`replay_of\`): ${range(replayFirst, replayLast)}, ${replays.length} líneas, una por cada línea de la versión 1, con la misma solicitud y el mismo estado.`,
    `- **Ondas nuevas de la versión 2:** ${range(replayLast + 1, rows.length)}, ${rows.length - replayLast} líneas.`,
    `- Total: ${rows.length} líneas (v1: ${v1.length}; v2: ${v2.length}, desde ${ref(v2First)}).`,
    "",
    "Cada `seq` empieza con `POST /__reset`, de modo que su primera solicitud parte de un estado vacío. El propósito de cada",
    "secuencia es la primera hipótesis registrada en ella.",
    "",
    "| seq | Líneas | Solicitudes | Versión | Propósito (primera hipótesis) |",
    "|---|---|---|---|---|",
  ];
  for (const g of groups) {
    lines.push(
      `| \`${g.seq}\` | ${range(g.first.id, g.last.id)} | ${g.rows.length} | ${g.first.version} | ${tableCell(truncate(g.first.hipotesis, 140))} |`,
    );
  }
  lines.push("");
  return lines;
}

/** The v2 replay of a v1 line when v2 changed its status or body, otherwise undefined. */
function changedReplay(entry: Entry, rows: readonly Row[]): Entry | undefined {
  const replay = rows.find((x) => x.entry.replayOf === entry.id)?.entry;
  if (replay === undefined) return undefined;
  const changed = replay.status !== entry.status || JSON.stringify(replay.response) !== JSON.stringify(entry.response);
  return changed ? replay : undefined;
}

function renderSummary(rows: readonly Row[], limitationCount: number): string[] {
  const v1 = rows.filter((r) => r.entry.version === "v1");
  const v2 = rows.filter((r) => r.entry.version === "v2");
  const count = (prefix: string): number => rows.filter((r) => r.entry.conclusion.startsWith(prefix)).length;
  const matching = (list: readonly Row[]): number => list.filter((r) => r.matches).length;
  const differing = v1.filter((r) => !r.matches);
  const lines = [
    "## Resumen de hallazgos",
    "",
    "Todas las cifras se calculan al generar el documento.",
    "",
    `- Líneas del log: ${rows.length} (versión 1: ${v1.length}; versión 2: ${v2.length}).`,
    `- Conclusiones que empiezan con "CAMBIO 1": ${count("CAMBIO 1")}.`,
    `- Conclusiones que empiezan con "CAMBIO 2": ${count("CAMBIO 2")}.`,
    `- Conclusiones que empiezan con "Consecuencia del CAMBIO": ${count("Consecuencia del CAMBIO")}.`,
    `- Conclusiones que empiezan con "Comportamiento de v2": ${count("Comportamiento de v2")}.`,
    `- La réplica coincide con el original en ${matching(v2)}/${v2.length} líneas de la versión 2.`,
    `- La réplica coincide con el original en ${matching(v1)}/${v1.length} líneas de la versión 1.`,
    `- Entradas con una línea de Limitación (el registro no alcanza para explicar algo): ${limitationCount}.`,
    "",
  ];
  if (differing.length > 0) {
    lines.push(
      "La réplica implementa la versión 2. Una diferencia en una línea de la versión 1 no es un defecto: indica un punto donde",
      "la versión 2 cambió el comportamiento. Líneas de la versión 1 que difieren:",
      "",
    );
    for (const r of differing) {
      const replay = changedReplay(r.entry, rows);
      lines.push(`- ${ref(r.entry.id)}${replay === undefined ? "" : ` (ver ${ref(replay.id)})`}`);
    }
    lines.push("");
  }
  lines.push(
    "### Leyenda de etiquetas de evidencia",
    "",
    "La etiqueta se asigna mecánicamente a partir de la conclusión registrada, en este orden de prioridad.",
    "",
    "| Etiqueta | Criterio |",
    "|---|---|",
    `| ${LABELS.consequence} | La conclusión empieza con "Consecuencia". |`,
    `| ${LABELS.change} | La conclusión contiene "CAMBIO 1" o "CAMBIO 2" y no es una consecuencia. |`,
    `| ${LABELS.v2Only} | La conclusión empieza con "Comportamiento de v2". |`,
    `| ${LABELS.preparation} | La conclusión empieza con "Preparación". |`,
    `| ${LABELS.baseline} | La línea es de la versión 1. |`,
    `| ${LABELS.repetition} | La línea tiene \`replay_of\` y la conclusión empieza con "Igual". |`,
    `| ${LABELS.observation} | Cualquier otro caso. |`,
    "",
    "Distribución de etiquetas:",
    "",
  );
  for (const label of Object.values(LABELS)) {
    lines.push(`- ${label}: ${rows.filter((r) => labelOf(r.entry) === label).length}`);
  }
  lines.push("");
  return lines;
}

function renderPreparation(group: SeqInfo, index: number, step: StepState): string {
  const position = `Posición ${index + 1} de ${group.rows.length} en \`${group.seq}\`.`;
  const first = group.rows[0]?.entry.id ?? 0;
  const built =
    index === 0
      ? "La secuencia empieza con `POST /__reset`, que borra cuentas, operaciones y contadores (MEM-01); no hay solicitudes previas."
      : `La secuencia empieza con \`POST /__reset\` (MEM-01) y sigue con las solicitudes ${range(first, first + index - 1)}, en orden; el efecto de cada una está en los pasos de la secuencia.`;
  return `${position} ${built} Estado previo, reconstruido con las respuestas registradas del original: ${step.before}.`;
}

interface RenderedEntry {
  lines: string[];
  limitations: string[];
}

function renderEntry(group: SeqInfo, index: number, ctx: Context): RenderedEntry {
  const row = group.rows[index];
  const step = row === undefined ? undefined : ctx.steps.get(row.entry.id);
  if (row === undefined || step === undefined) throw new Error("entry index out of range");
  const { entry } = row;
  const limitations: string[] = [];
  const category = categoryOf(entry);
  if (category === undefined) limitations.push("ninguna categoría de prueba aplica a esta línea: el registro no permite explicar por qué importa.");
  const relations = relationsOf(row, ctx);
  if (!relations.hasAny && category?.key !== "preparation") {
    limitations.push("ninguna fila de la especificación cita esta línea y no hay otras líneas ni ejemplos oficiales con la misma solicitud: el registro no permite relacionarla con las reglas más allá de su propia conclusión.");
  }
  if (!responseIsDescribed(row)) limitations.push("la respuesta del original no figura en el glosario: el registro no permite explicar su significado.");
  const conclusion = describeConclusion(row, ctx);
  if (conclusion.limitation !== null) limitations.push(conclusion.limitation);

  const lines = [`#### ${ref(entry.id)} — ${titleOf(row)}`, ""];
  if (entry.replayOf !== null) lines.push(`Repite ${ref(entry.replayOf)} (v1).`, "");
  lines.push(
    `**Qué se quería saber y por qué importa:** pregunta registrada: «${entry.hipotesis}»`,
    "",
    category === undefined ? "Categoría: ninguna aplica." : `Categoría: ${category.label}. ${category.why}`,
    "",
    `**Estado previo y cómo se construye:** ${renderPreparation(group, index, step)}`,
    "",
    "**Qué hace la solicitud:**",
    "",
    ...describeRequest(row).flatMap((paragraph) => [paragraph, ""]),
    ...fenced(curlFor(row), "bash"),
    "",
    `Efecto esperado en el estado, según la respuesta registrada del original: ${step.effect}`,
    "",
    `**Respuesta observada del original:** versión ${entry.version}, status ${entry.status}`,
    "",
    ...fenced(renderBody(entry.response)),
    "",
    describeResponse(row),
    "",
    `**Respuesta de la réplica:** status ${row.measured.status} — ${row.matches ? "coincide" : "difiere"}`,
    "",
    ...fenced(renderMeasured(row.measured)),
    "",
  );
  if (row.matches) {
    lines.push("Coinciden el status y el JSON del original.", "");
  } else if (entry.version === "v1") {
    const replay = changedReplay(entry, ctx.rows);
    lines.push(
      replay === undefined
        ? "La réplica implementa la versión 2 y esta respuesta difiere de la registrada."
        : `La réplica implementa la versión 2: v2 cambió este comportamiento, ver ${ref(replay.id)}.`,
      "",
    );
  } else {
    lines.push("La réplica no reproduce la respuesta registrada de v2.", "");
  }
  lines.push("**Qué permite concluir y qué sigue siendo hipótesis:**", "", ...conclusion.lines.flatMap((l) => [l, ""]));
  lines.push("**Relación con otros experimentos y con la especificación:**", "", ...relations.lines, "");
  for (const limitation of limitations) lines.push(`**Limitación:** ${limitation}`, "");
  return { lines, limitations };
}

function describeSequence(group: SeqInfo, ctx: Context): string[] {
  const rows = group.rows;
  const stems = stemOf(group.seq);
  const commands = [...new Set(rows.map((r) => messageOf(r.entry.request)?.split(";")[0]?.toUpperCase()).filter((c): c is string => c !== undefined && c !== ""))];
  const errors = new Map<string, number>();
  for (const r of rows) {
    const code = asRecord(r.entry.response)?.["error"];
    if (typeof code === "string") errors.set(code, (errors.get(code) ?? 0) + 1);
  }
  const categories = new Map<string, number>();
  for (const r of rows) {
    const label = categoryOf(r.entry)?.label ?? "Sin categoría";
    categories.set(label, (categories.get(label) ?? 0) + 1);
  }
  const specRows = new Set(rows.flatMap((r) => (ctx.spec.citedBy.get(r.entry.id) ?? []).map((s) => s.id)));
  const lines = [
    `Secuencia de ${rows.length} solicitud(es) de ${group.first.version}${stems === null ? "" : `, nombre base \`${stems}\``}. Propósito: ${group.first.hipotesis}`,
    "",
    `- Categorías de sus entradas: ${[...categories].map(([label, n]) => `${label} (${n})`).join("; ")}.`,
    `- Comandos que envía: ${commands.length === 0 ? "ninguno (solo sondas HTTP)" : commands.map((c) => `\`${c}\``).join(", ")}.`,
    `- Errores que devuelve el original: ${errors.size === 0 ? "ninguno" : [...errors].map(([code, n]) => `${code} (${n})`).join(", ")}.`,
  ];
  const replayed = group.first.replayOf;
  if (replayed !== null) {
    const base = ctx.byId.get(replayed);
    const changed = rows.filter((r) => changedReplay(ctx.byId.get(r.entry.replayOf ?? -1)?.entry ?? r.entry, ctx.rows) !== undefined);
    lines.push(
      `- Repite solicitud a solicitud la secuencia \`${base?.entry.seq ?? "?"}\` (v1) contra v2; ${changed.length === 0 ? "ninguna respuesta cambió" : `${changed.length} respuesta(s) cambiaron: ${citeList(changed.map((r) => r.entry.id), 12)}`}.`,
    );
  }
  lines.push(`- Filas de la especificación que citan sus líneas: ${specRows.size === 0 ? "ninguna" : [...specRows].join(", ")}.`, "");
  lines.push("Pasos y efecto sobre el estado (según las respuestas registradas del original):", "");
  for (const r of rows) {
    const summary = messageOf(r.entry.request) ?? `${r.method} ${r.path}`;
    lines.push(`- ${ref(r.entry.id)} \`${summary.replaceAll("`", "'")}\` → status ${r.entry.status}: ${ctx.steps.get(r.entry.id)?.effect ?? ""}`);
  }
  lines.push("");
  return lines;
}

interface Sequences {
  lines: string[];
  limitationCount: number;
}

function renderSequences(groups: readonly SeqInfo[], ctx: Context): Sequences {
  const lines = ["## Experimentos por secuencia", ""];
  let limitationCount = 0;
  for (const group of groups) {
    lines.push(`### ${group.seq} — ${group.first.version}, ${range(group.first.id, group.last.id)}`, "", ...describeSequence(group, ctx));
    group.rows.forEach((_, index) => {
      const rendered = renderEntry(group, index, ctx);
      if (rendered.limitations.length > 0) limitationCount += 1;
      lines.push(...rendered.lines);
    });
  }
  return { lines, limitationCount };
}

/** Replays the whole log against an in-process replica and returns the text of docs/experimentos.md. */
export async function generateGuide(): Promise<string> {
  const log = readLog();
  const rows = await replayAll(log);
  const groups = groupBySeq(rows);
  const spec = loadSpec();
  assertGlossaryCitations(spec);
  const ctx: Context = { rows, byId: new Map(rows.map((r) => [r.entry.id, r])), spec, examples: loadExamples(), steps: reconstructStates(groups) };
  const sequences = renderSequences(groups, ctx);
  const text = [
    ...renderIntro(),
    ...renderMethod(groups, rows),
    ...renderSummary(rows, sequences.limitationCount),
    ...renderGlossary(),
    ...sequences.lines,
  ].join("\n");
  return `${text.trimEnd()}\n`;
}

async function main(): Promise<number> {
  const generated = await generateGuide();
  if (process.argv.includes("--check")) {
    const onDisk = existsSync(GUIDE_PATH) ? readFileSync(GUIDE_PATH, "utf8").replaceAll("\r\n", "\n") : null;
    if (onDisk === generated) {
      console.log("docs/experimentos.md is up to date");
      return 0;
    }
    console.error("docs/experimentos.md is stale: run `npm run docs:experiments`");
    return 1;
  }
  writeFileSync(GUIDE_PATH, generated);
  console.log(`wrote docs/experimentos.md (${generated.split("\n").length - 1} lines)`);
  return 0;
}

if (import.meta.main) {
  process.exitCode = await main();
}
