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
