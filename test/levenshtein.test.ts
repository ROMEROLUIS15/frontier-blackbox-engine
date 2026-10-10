import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { levenshtein } from "../src/protocol/levenshtein.ts";
import { suggestCommand } from "../src/protocol/parse.ts";

describe("levenshtein", () => {
  const cases: Array<[string, string, number]> = [
    ["", "", 0],
    ["PING", "PING", 0],
    ["PIN", "PING", 1],
    ["PINGG", "PING", 1],
    ["PINK", "PING", 1],
    [" PING", "PING", 1],
    ["", "ALTA", 4],
    ["kitten", "sitting", 3],
    ["SALDOS", "ANULA", 5],
  ];
  for (const [a, b, distance] of cases) {
    test(`distance(${JSON.stringify(a)}, ${JSON.stringify(b)}) is ${distance}`, () => {
      assert.equal(levenshtein(a, b), distance);
      assert.equal(levenshtein(b, a), distance);
    });
  }
});

describe("suggestCommand (R11, experimentos.jsonl wave 10)", () => {
  const cases: Array<[string, string | null, string]> = [
    [" PING", "PING", "X:286"],
    ["ALTA ", "ALTA", "X:287"],
    ["PIN", "PING", "X:300"],
    ["PINGG", "PING", "X:301"],
    ["DEPOSITOS", "DEPOSITO", "X:302"],
    ["CONSULT", "CONSULTA", "X:303"],
    ["PING ", "PING", "X:304 (after upper-casing)"],
    ["AL TA", "ALTA", "X:305"],
    ["CONSUL", "CONSULTA", "X:311 (distance 2)"],
    ["PIGN", "PING", "X:312 (distance 2)"],
    ["DEPOS", null, "X:313 (distance 3)"],
    ["XYZ", null, "X:308"],
    ["SALDOS", null, "X:126 (nearest command is at distance 4)"],
  ];
  for (const [name, expected, evidence] of cases) {
    test(`${JSON.stringify(name)} suggests ${String(expected)} (${evidence})`, () => {
      assert.equal(suggestCommand(name), expected);
    });
  }
});
