import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generateGuide } from "../scripts/experiment-guide.ts";

const root = join(import.meta.dirname, "..");
const guidePath = join(root, "docs", "experimentos.md");

describe("experiment guide", () => {
  test("docs/experimentos.md exists", () => {
    assert.ok(existsSync(guidePath), "run `npm run docs:experiments` to generate docs/experimentos.md");
  });

  test("docs/experimentos.md is up to date with experimentos.jsonl and the replica", async () => {
    const expected = await generateGuide();
    const actual = readFileSync(guidePath, "utf8").replaceAll("\r\n", "\n");
    assert.ok(actual === expected, "docs/experimentos.md is stale: run `npm run docs:experiments`");
  });

  test("generation is deterministic", async () => {
    assert.equal(await generateGuide(), await generateGuide());
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

  test("there is one entry per logged line", () => {
    assert.equal(entries.length, 313);
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
