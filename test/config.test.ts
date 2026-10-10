import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../src/config.ts";

test("PORT defaults to 3000 when unset", () => {
  assert.equal(parsePort(undefined), 3000);
});

test("PORT accepts integers from 1 to 65535", () => {
  assert.equal(parsePort("8080"), 8080);
  assert.equal(parsePort("1"), 1);
  assert.equal(parsePort("65535"), 65535);
});

test("PORT rejects empty, non-numeric and out-of-range values", () => {
  for (const raw of ["", "abc", "80a", "0", "-1", "65536", "3.5", " 80"]) {
    assert.equal(parsePort(raw), null, `PORT=${JSON.stringify(raw)}`);
  }
});
