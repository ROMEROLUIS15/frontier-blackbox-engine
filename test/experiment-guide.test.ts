import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generateGuide } from "../scripts/experiment-guide.ts";

const root = join(import.meta.dirname, "..");
const guidePath = join(root, "docs", "experimentos.md");

// Trusted fixture: the log of real requests to the original service.
const logged = readFileSync(join(root, "experimentos.jsonl"), "utf8")
  .split("\n")
  .filter((line) => line.trim() !== "")
  .map((line) => JSON.parse(line) as { id: number; seq: string });
const fuzzLogged = logged.filter((e) => e.seq.startsWith("s-fz-"));
const fuzzSequences = [...new Set(fuzzLogged.map((e) => e.seq))];

describe("experiment guide", () => {
  test("docs/experimentos.md exists", () => {
    assert.ok(existsSync(guidePath), "run `npm run docs:experiments` to generate docs/experimentos.md");
  });

  // The generation replays the whole log, so it runs once per file and both tests below share it.
  const generated = generateGuide();

  test("docs/experimentos.md is up to date with experimentos.jsonl and the replica", async () => {
    const expected = await generated;
    const actual = readFileSync(guidePath, "utf8").replaceAll("\r\n", "\n");
    assert.ok(actual === expected, "docs/experimentos.md is stale: run `npm run docs:experiments`");
  });

  test("generation is deterministic", async () => {
    assert.equal(await generateGuide(), await generated);
  });
});

const ENTRY_HEADINGS = [
  "**Qué se quería saber y por qué importa:**",
  "**Estado previo y cómo se construye:**",
  "**Qué hace la solicitud:**",
  "**Respuesta observada del original:**",
  "**Respuesta de la réplica:**",
  "**Qué permite concluir y qué sigue siendo hipótesis:**",
  "**Relación con otros experimentos y con la especificación:**",
];

describe("experiment guide structure", () => {
  const guide = existsSync(guidePath) ? readFileSync(guidePath, "utf8") : "";
  const entries = guide.split(/^#### /m).slice(1);

  test("there is one full entry per logged line outside the fuzzing campaign", () => {
    assert.equal(entries.length, logged.length - fuzzLogged.length);
    for (const e of fuzzLogged.slice(0, 50)) assert.ok(!guide.includes(`#### X:${e.id} `), `X:${e.id} must be condensed`);
  });

  test("the probe sequences keep full entries", () => {
    for (const id of [338, 2438, 2467, 2473, 2479]) assert.ok(guide.includes(`#### X:${id} `), `X:${id}`);
  });

  test("every entry carries the seven explanation headings in order", () => {
    const failures: string[] = [];
    for (const entry of entries) {
      let from = 0;
      for (const heading of ENTRY_HEADINGS) {
        const at = entry.indexOf(heading, from);
        if (at < 0) {
          failures.push(`${entry.split("\n")[0]}: missing "${heading}"`);
          break;
        }
        from = at;
      }
    }
    assert.deepEqual(failures.slice(0, 5), []);
  });

  test("the introduction separates official examples (E:n) from our experiments (X:n)", () => {
    assert.ok(guide.includes("`E:n`") && guide.includes("`X:n`"));
    assert.ok(guide.includes("pruebas/ejemplos.jsonl"));
  });

  test("the glossary cites the specification and describes the control digit", () => {
    assert.ok(guide.includes("## Glosario"));
    assert.ok(guide.includes("ISO 7064 MOD 97-10"));
    assert.ok(guide.includes("INT-03"));
  });

  test("the guide is agnostic: no local paths or timestamps", () => {
    assert.doesNotMatch(guide, /[A-Za-z]:\\|\/Users\/|\d{4}-\d{2}-\d{2}T\d{2}:/);
  });
});

describe("condensed fuzzing section", () => {
  const guide = existsSync(guidePath) ? readFileSync(guidePath, "utf8") : "";
  const section = guide.split(/^## /m).find((block) => block.startsWith("Fuzzing diferencial")) ?? "";
  const rows = section.split("\n").filter((line) => /^\| `s-fz-/.test(line));

  test("explains the method, the seeds and the batch sizes", () => {
    assert.ok(section.includes("1 a 12 pasos"));
    assert.ok(section.includes("semilla 20261011, 300 secuencias"));
    assert.ok(section.includes("semilla 20261012, 300 secuencias"));
    assert.ok(section.includes("semilla 20261013, 200 secuencias"));
    assert.ok(section.includes("CMD-10b"));
  });

  test("has one row per fuzz sequence and their steps cover every fuzz line", () => {
    assert.equal(rows.length, fuzzSequences.length);
    let covered = 0;
    for (const seq of fuzzSequences) {
      const row = rows.find((line) => line.startsWith(`| \`${seq}\` |`));
      assert.ok(row !== undefined, seq);
      const cells = row.split("|").map((cell) => cell.trim());
      const lines = fuzzLogged.filter((e) => e.seq === seq).length;
      const steps = Number(cells[3]);
      assert.ok(steps >= 1 && steps <= 12, `${seq}: ${steps} steps`);
      assert.equal(steps + 1, lines, `${seq}: steps plus the reset line`);
      covered += lines;
    }
    assert.equal(covered, fuzzLogged.length);
  });

  test("the replica comparison is measured for every row", () => {
    for (const row of rows) assert.match(row, /\| (sí|no) \|$/);
    assert.match(section, /la réplica coincide con el original en \d+\/\d+ líneas/);
  });
});

describe("official example cross references", () => {
  const guide = existsSync(guidePath) ? readFileSync(guidePath, "utf8") : "";
  const entry = (id: number): string => guide.split(/^#### /m).find((block) => block.startsWith(`X:${id} `)) ?? "";
  const exampleLine = (id: number): string => entry(id).split("\n").find((line) => line.includes("Ejemplo oficial E:")) ?? "";

  test("a different auth, route or method is not called the same request", () => {
    for (const id of [1, 8, 10, 11, 85, 250, 251, 256, 257]) {
      const line = exampleLine(id);
      assert.ok(line.includes("mismo mensaje"), `X:${id}: ${line}`);
      assert.ok(!line.includes("misma solicitud"), `X:${id}: ${line}`);
      assert.ok(!line.includes("difiere"), `X:${id}: ${line}`);
    }
  });

  test("an identical method, route, auth and body is called the same request", () => {
    assert.ok(exampleLine(35).includes("misma solicitud"));
  });
});
