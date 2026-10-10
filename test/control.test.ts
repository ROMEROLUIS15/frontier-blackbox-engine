import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { controlDigit } from "../src/control/iso7064.ts";

const lines = readFileSync(join(import.meta.dirname, "..", "pruebas", "ejemplos.jsonl"), "utf8")
  .split("\n")
  .filter((l) => l.trim() !== "")
  .map((l) => JSON.parse(l) as { n: number; request: { m: string }; response: { error?: string } });

function split(m: string): { payload: string; control: string } {
  const i = m.lastIndexOf(";");
  return { payload: m.slice(0, i), control: m.slice(i + 1) };
}

test("control digit matches every recorded example that is not E201/E202", () => {
  for (const line of lines) {
    if (line.response.error === "E201" || line.response.error === "E202") continue;
    const { payload, control } = split(line.request.m);
    assert.equal(controlDigit(payload), Number(control), `line ${line.n}: ${line.request.m}`);
  }
});

test("ALTA;Lucia;83 is not valid", () => {
  assert.notEqual(controlDigit("ALTA;Lucia"), 83);
  assert.equal(controlDigit("ALTA;Lucia"), 82);
});

test("known values", () => {
  assert.equal(controlDigit("PING"), 64);
  assert.equal(controlDigit("CONSULTA;AC-0001"), 14);
});

test("edge cases from experiments", () => {
  assert.equal(controlDigit("ALTA;Mava"), 98);
  assert.notEqual(controlDigit("ALTA;Laro"), 1);
  assert.equal(controlDigit("ALTA;Mari"), 97);
  assert.notEqual(controlDigit("ALTA;Miro"), 0);
});
