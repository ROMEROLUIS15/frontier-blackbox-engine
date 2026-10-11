import { describe, test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createServer } from "../src/http/server.ts";
import { controlDigit } from "../src/control/iso7064.ts";

// Rule C of version 2 of the original service: a TRANSFER between two accounts whose holder names (the ALTA name
// argument) are exactly equal is not subject to the 50000 limit. "X:n" is line n of experimentos.jsonl.
const TOKEN = "test-token";

let server: Server;
let base = "";

before(async () => {
  server = createServer(TOKEN);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function post(path: string, body: unknown): Promise<{ status: number; body: unknown }> {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

beforeEach(async () => {
  await post("/__reset", {});
});

/** Sends `fields` joined by `;` plus the correct control digit. */
function signed(...fields: string[]): Promise<{ status: number; body: unknown }> {
  const payload = fields.join(";");
  return post("/msg", { m: `${payload};${controlDigit(payload)}` });
}

const E506 = { status: 422, body: { error: "E506", mensaje: "límite excedido" } };
const E507 = { status: 422, body: { error: "E507", mensaje: "saldo insuficiente" } };

describe("rule C: transfers between accounts of the same holder skip the 50000 limit", () => {
  test("same holder above the limit with enough balance -> 200 and the balances move (X:2467-2468)", async () => {
    await signed("ALTA", "Ana");
    await signed("ALTA", "Ana");
    await signed("DEPOSITO", "AC-0001", "200000");
    const reply = await signed("TRANSFER", "AC-0001", "AC-0002", "100000");
    assert.deepEqual(reply, { status: 200, body: { status: "recieved", operacionId: "OP-0002" } });
    assert.deepEqual((await signed("CONSULTA", "AC-0002")).body, { cuenta_id: "AC-0002", saldo: "1000.00" });
    assert.deepEqual((await signed("CONSULTA", "AC-0001")).body, { cuenta_id: "AC-0001", saldo: "1000.00" });
  });

  test("the comparison is case-sensitive: Ana and ana are different holders (X:2473)", async () => {
    await signed("ALTA", "Ana");
    await signed("ALTA", "ana");
    await signed("DEPOSITO", "AC-0001", "200000");
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "100000"), E506);
  });

  test("different holders keep the limit (X:2442-2462, X:320)", async () => {
    await signed("ALTA", "Ana");
    await signed("ALTA", "Beto");
    await signed("DEPOSITO", "AC-0001", "200000");
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "50001"), E506);
  });

  test("same holder above the limit and above the balance -> E507, not E506 (X:610, X:1304)", async () => {
    await signed("ALTA", "Ana");
    await signed("ALTA", "Ana");
    await signed("DEPOSITO", "AC-0001", "1000");
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "100000"), E507);
  });

  test("a rejected same-holder transfer consumes no operation number and moves no money", async () => {
    await signed("ALTA", "Ana");
    await signed("ALTA", "Ana");
    await signed("DEPOSITO", "AC-0001", "1000");
    await signed("TRANSFER", "AC-0001", "AC-0002", "100000");
    assert.deepEqual((await signed("DEPOSITO", "AC-0001", "1")).body, { status: "recieved", operacionId: "OP-0002" });
    assert.deepEqual((await signed("CONSULTA", "AC-0002")).body, { cuenta_id: "AC-0002", saldo: "0.00" });
  });

  test("non-contiguous accounts of the same holder (Ana, Beto, Ana) (X:2479)", async () => {
    await signed("ALTA", "Ana");
    await signed("ALTA", "Beto");
    await signed("ALTA", "Ana");
    await signed("DEPOSITO", "AC-0001", "200000");
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0003", "100000"), {
      status: 200,
      body: { status: "recieved", operacionId: "OP-0002" },
    });
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "50001"), E506);
  });

  test("a reset forgets the holders", async () => {
    await signed("ALTA", "Ana");
    await signed("ALTA", "Ana");
    await post("/__reset", {});
    await signed("ALTA", "Ana");
    await signed("ALTA", "Beto");
    await signed("DEPOSITO", "AC-0001", "200000");
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "100000"), E506);
  });
});
