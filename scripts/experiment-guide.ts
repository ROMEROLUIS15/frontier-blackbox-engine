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
import { createServer } from "../src/http/server.ts";

const ROOT = join(import.meta.dirname, "..");
const LOG_PATH = join(ROOT, "experimentos.jsonl");
const GUIDE_PATH = join(ROOT, "docs", "experimentos.md");

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

function authDescription(auth: Auth): string {
  if (auth === "team") return "token del equipo (`Authorization: Bearer $TEAM_TOKEN`)";
  if (auth === "wrong") return `token incorrecto (\`Authorization: Bearer ${WRONG_TOKEN}\`)`;
  if (auth === "bearer-lower") return "esquema en minúsculas (`Authorization: bearer $TEAM_TOKEN`)";
  if (auth === "no-scheme") return "token sin esquema (`Authorization: $TEAM_TOKEN`)";
  return "sin cabecera `Authorization`";
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
    "> cualquier cambio se hace en el log o en el generador y se regenera.",
    "",
    "## Propósito y cómo leer cada entrada",
    "",
    "Este documento explica, línea por línea, cada solicitud registrada en `experimentos.jsonl` (`X:n` = línea con `id` n):",
    "qué se quería saber, en qué estado se hizo, cómo repetirla, qué respondió el servicio original, qué responde la réplica",
    "y qué conclusión se registró. Cada entrada contiene:",
    "",
    "- **Pregunta (hipótesis):** la hipótesis registrada, tal cual, antes de enviar la solicitud.",
    "- **Preparación:** posición dentro de su secuencia y solicitudes previas que dejaron el estado necesario.",
    "- **Solicitud:** comando `curl` ejecutable.",
    "- **Respuesta del original:** status y cuerpo registrados (evidencia).",
    "- **Respuesta de la réplica:** status y cuerpo medidos al generar este documento, y si coinciden con el original.",
    "- **Conclusión:** la interpretación registrada en el log, con su etiqueta de evidencia.",
    "",
    "La hipótesis es la pregunta formulada antes de la solicitud; la evidencia es el par status + cuerpo observado; la",
    "conclusión es la interpretación que se anotó en el log y puede ser más débil que la evidencia (por ejemplo, una",
    "inferencia).",
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

function renderSummary(rows: readonly Row[]): string[] {
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

function renderPreparation(group: SeqInfo, index: number): string {
  const position = `Posición ${index + 1} de ${group.rows.length} en \`${group.seq}\`.`;
  if (index === 0) return `${position} Estado vacío tras \`POST /__reset\`.`;
  const previous = group.rows
    .slice(0, index)
    .map((r) => {
      const summary = requestSummary(r.entry.request);
      return summary === null ? `${ref(r.entry.id)} (${r.method} ${r.path})` : `${ref(r.entry.id)} (\`${summary.replaceAll("`", "'")}\`)`;
    })
    .join(", ");
  return `${position} Solicitudes previas tras el reset: ${previous}.`;
}

function renderEntry(group: SeqInfo, index: number, rows: readonly Row[]): string[] {
  const row = group.rows[index];
  if (row === undefined) throw new Error("entry index out of range");
  const { entry } = row;
  const lines = [`#### ${ref(entry.id)} — ${titleOf(row)}`, ""];
  if (entry.replayOf !== null) lines.push(`Repite ${ref(entry.replayOf)} (v1).`, "");
  lines.push(`**Pregunta (hipótesis):** ${entry.hipotesis}`, "", `**Preparación:** ${renderPreparation(group, index)}`, "");
  const inferredNote = row.inferredFrom === null ? "" : ` Método, ruta y autenticación no constan en esta línea: se infieren de ${ref(row.inferredFrom)}, su repetición en v2.`;
  lines.push(`**Solicitud:** ${row.method} \`${row.path}\`, ${authDescription(row.auth)}.${inferredNote}`, "", ...fenced(curlFor(row), "bash"), "");
  lines.push(`**Respuesta del original** (${entry.version}): status ${entry.status}`, "", ...fenced(renderBody(entry.response)), "");
  lines.push(`**Respuesta de la réplica:** status ${row.measured.status} — ${row.matches ? "coincide" : "difiere"}`, "", ...fenced(renderMeasured(row.measured)), "");
  if (!row.matches && entry.version === "v1") {
    const replay = changedReplay(entry, rows);
    lines.push(
      replay === undefined
        ? "La réplica implementa la versión 2 y esta respuesta difiere de la registrada."
        : `La réplica implementa la versión 2: v2 cambió este comportamiento, ver ${ref(replay.id)}.`,
      "",
    );
  }
  lines.push(`**Conclusión:** ${entry.conclusion}`, "", `**Etiqueta de evidencia:** ${labelOf(entry)}`, "");
  return lines;
}

function renderSequences(groups: readonly SeqInfo[], rows: readonly Row[]): string[] {
  const lines = ["## Experimentos por secuencia", ""];
  for (const group of groups) {
    lines.push(`### ${group.seq} — ${group.first.version}, ${range(group.first.id, group.last.id)}`, "");
    group.rows.forEach((_, index) => lines.push(...renderEntry(group, index, rows)));
  }
  return lines;
}

/** Replays the whole log against an in-process replica and returns the text of docs/experimentos.md. */
export async function generateGuide(): Promise<string> {
  const log = readLog();
  const rows = await replayAll(log);
  const groups = groupBySeq(rows);
  const text = [...renderIntro(), ...renderMethod(groups, rows), ...renderSummary(rows), ...renderSequences(groups, rows)].join("\n");
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
