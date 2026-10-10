/**
 * Architecture boundaries for the pure core (src/control, src/bank).
 * 1. Runtime import graph: the modules Node actually resolves (transitively) must stay inside
 *    src/control, src/bank or src/protocol. No node:* builtins, npm packages, src/http, src/main or src/config.
 * 2. Ambient globals: the type-stripped source, with comments and string literals removed, must not use
 *    I/O, environment, time or randomness globals, nor dynamic import/require.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");
const PURE_DIRS = ["src/control", "src/bank"];
const ALLOWED_DIRS = ["src/control/", "src/bank/", "src/protocol/"].map((d) => pathToFileURL(join(root, d)).href);
const FORBIDDEN_GLOBALS = ["process", "globalThis", "global", "require", "fetch", "Buffer", "Date", "performance", "setTimeout", "setInterval", "setImmediate", "crypto", "console"];

const GRAPH_SCRIPT = `
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
const seen = new Set();
registerHooks({ resolve(specifier, context, next) { const r = next(specifier, context); seen.add(r.url); return r; } });
await import(pathToFileURL(process.argv[1]).href);
process.stdout.write(JSON.stringify([...seen]));
`;

function runtimeGraph(file: string): string[] {
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", GRAPH_SCRIPT, file], { encoding: "utf8" });
  const parsed: unknown = JSON.parse(out);
  assert.ok(Array.isArray(parsed) && parsed.every((u) => typeof u === "string"), "graph output must be a string array");
  return parsed.filter((u): u is string => typeof u === "string");
}

function graphViolations(file: string): string[] {
  return runtimeGraph(file).filter((url) => !ALLOWED_DIRS.some((dir) => url.startsWith(dir)));
}

/** Removes comments and string/template literal contents so only code tokens remain. */
function codeOnly(js: string): string {
  let out = "";
  for (let i = 0; i < js.length; i++) {
    const c = js[i] ?? "";
    const n = js[i + 1] ?? "";
    if (c === "/" && n === "/") {
      while (i < js.length && js[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && n === "*") {
      i += 2;
      while (i < js.length && !(js[i] === "*" && js[i + 1] === "/")) i++;
      i++;
      out += " ";
    } else if (c === '"' || c === "'" || c === "`") {
      i++;
      while (i < js.length && js[i] !== c) i += js[i] === "\\" ? 2 : 1;
      out += '""';
    } else {
      out += c;
    }
  }
  return out;
}

function globalViolations(source: string): string[] {
  const code = codeOnly(stripTypeScriptTypes(source));
  const found = new Set<string>();
  for (const name of FORBIDDEN_GLOBALS) {
    // identifier not preceded by "." (property access) nor followed by ":" (object key)
    if (new RegExp(`(?<![.\\w$])${name}(?![\\w$]|\\s*:)`).test(code)) found.add(name);
  }
  if (/(?<![.\w$])import\s*\(/.test(code)) found.add("import()");
  return [...found];
}

const pureFiles = PURE_DIRS.flatMap((dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".ts"))
    .map((f) => join(root, dir, f)),
);

test("pure core files exist", () => {
  assert.ok(pureFiles.length >= 3, `found ${pureFiles.length} files`);
});

for (const file of pureFiles) {
  const rel = file.slice(root.length + 1).replaceAll("\\", "/");
  test(`${rel}: runtime imports stay inside control/bank/protocol`, () => {
    assert.deepEqual(graphViolations(file), []);
  });
  test(`${rel}: no I/O, environment, time or randomness globals`, () => {
    assert.deepEqual(globalViolations(readFileSync(file, "utf8")), []);
  });
}

test("boundary checks detect violations (negative fixture)", () => {
  const dir = mkdtempSync(join(tmpdir(), "boundary-"));
  try {
    const fixture = join(dir, "bad.ts");
    writeFileSync(
      fixture,
      [
        'import { readFileSync } from "node:fs";',
        "// process.exit is mentioned in a comment and must not count",
        'const label: string = "Date.now() inside a string must not count";',
        "export const read = (): string => readFileSync(process.env.FILE ?? label, \"utf8\") + String(Date.now());",
        'export const lazy = (): Promise<unknown> => import("node:os");',
      ].join("\n"),
    );
    assert.ok(graphViolations(fixture).includes("node:fs"), "node:fs import not detected");
    const globals = globalViolations(readFileSync(fixture, "utf8"));
    assert.deepEqual(globals.sort(), ["Date", "import()", "process"].sort());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
