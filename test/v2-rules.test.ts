import { describe, test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createServer } from "../src/http/server.ts";
import { controlDigit } from "../src/control/iso7064.ts";
import * as commands from "../src/bank/commands.ts";

// Rules R1-R8 of version 2 of the original service. "X:n" is line n of experimentos.jsonl.
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

/** Sends the raw message `m` exactly as written. */
function raw(m: string): Promise<{ status: number; body: unknown }> {
  return post("/msg", { m });
}

/** Sends `fields` joined by `;` plus the correct control digit. */
function signed(...fields: string[]): Promise<{ status: number; body: unknown }> {
  const payload = fields.join(";");
  return raw(`${payload};${controlDigit(payload)}`);
}

const E104 = { status: 400, body: { error: "E104", mensaje: "segmento vacío" } };
const E103 = { status: 400, body: { error: "E103", mensaje: "falta control" } };
const E302 = { status: 400, body: { error: "E302", mensaje: "aridad inválida" } };
const E303 = { status: 400, body: { error: "E303", mensaje: "monto inválido" } };
const E304 = { status: 400, body: { error: "E304", mensaje: "origen y destino iguales" } };
const E401 = { status: 404, body: { error: "E401", mensaje: "cuenta inexistente" } };
const E506 = { status: 422, body: { error: "E506", mensaje: "límite excedido" } };
const E507 = { status: 422, body: { error: "E507", mensaje: "saldo insuficiente" } };
const PONG = { status: 200, body: { pong: true } };

async function openAccounts(count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) await signed("ALTA", "Ana");
}

describe("R1: every empty segment is E104, before control and command checks", () => {
  const cases: Array<[string, string]> = [
    ["X:179 ALTA;;85", "ALTA;;85"],
    ["X:194 CONSULTA;;11", "CONSULTA;;11"],
    ["X:195 DEPOSITO;AC-0001;;4", "DEPOSITO;AC-0001;;4"],
    ["X:196 TRANSFER;AC-0001;;100;27", "TRANSFER;AC-0001;;100;27"],
    ["X:198 wrong control still E104 (ALTA;;86)", "ALTA;;86"],
    ["X:199 empty control (ALTA;Ana;)", "ALTA;Ana;"],
    ["X:200 PING;;64", "PING;;64"],
    ["X:201 SALDOS;;55 (unknown command)", "SALDOS;;55"],
    ["X:202 ALTA;;;85", "ALTA;;;85"],
    ["X:205 empty first segment (;PING;64)", ";PING;64"],
    ["X:242 PING; (empty control)", "PING;"],
  ];
  for (const [name, m] of cases) {
    test(name, async () => {
      assert.deepEqual(await raw(m), E104);
    });
  }

  test("X:203 a segment with a single space is not empty", async () => {
    assert.deepEqual(await raw("ALTA; ;85"), { status: 201, body: { cuentaId: "AC-0001" } });
  });
});

describe("R2: a message without ';' is E103, including the empty message", () => {
  test("X:204 empty m", async () => {
    assert.deepEqual(await raw(""), E103);
  });
  test("X:60 / X:144 PING without ';'", async () => {
    assert.deepEqual(await raw("PING"), E103);
  });
});

describe("R3: PING ignores the control but checks arity", () => {
  test("X:197 PING;XX (malformed control) is 200 pong", async () => {
    assert.deepEqual(await raw("PING;XX"), PONG);
  });
  test("X:212 PING;63 (wrong control value) is 200 pong", async () => {
    assert.deepEqual(await raw("PING;63"), PONG);
  });
  test("X:213 PING;A;XX is E302", async () => {
    assert.deepEqual(await raw("PING;A;XX"), E302);
  });
  test("X:141 the command name is case-insensitive (ping;64)", async () => {
    assert.deepEqual(await raw("ping;64"), PONG);
  });
  test("other commands still validate the control (X:51-56 order E201 -> E202)", async () => {
    assert.deepEqual(await raw("ALTA;Ana;XX"), { status: 400, body: { error: "E201", mensaje: "control mal formado" } });
    assert.deepEqual(await raw("ALTA;Ana;0"), { status: 400, body: { error: "E202", mensaje: "control inválido" } });
  });
});

describe("R4: TRANSFER limit is 50000 inclusive", () => {
  test("X:190 50000 is accepted and X:191 50001 is E506", async () => {
    await openAccounts(2);
    await signed("DEPOSITO", "AC-0001", "60000");
    assert.deepEqual((await signed("TRANSFER", "AC-0001", "AC-0002", "50000")).status, 200);
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "50001"), E506);
  });
});

describe("R5: amount maximum 9999999999 (DEPOSITO and TRANSFER), checked before E506", () => {
  test("X:278 DEPOSITO 10000000000 is E303 and leaves the balance at 0", async () => {
    await openAccounts(1);
    assert.deepEqual(await signed("DEPOSITO", "AC-0001", "10000000000"), E303);
    assert.deepEqual((await signed("CONSULTA", "AC-0001")).body, { cuenta_id: "AC-0001", saldo: "0.00" });
  });
  test("X:279-281 DEPOSITO 9999999999 twice is accepted (no balance cap)", async () => {
    await openAccounts(1);
    assert.deepEqual((await signed("DEPOSITO", "AC-0001", "9999999999")).body, { status: "recieved", operacionId: "OP-0001" });
    assert.deepEqual((await signed("DEPOSITO", "AC-0001", "9999999999")).body, { status: "recieved", operacionId: "OP-0002" });
    assert.deepEqual((await signed("CONSULTA", "AC-0001")).body, { cuenta_id: "AC-0001", saldo: "199999999.98" });
  });
  test("X:275 TRANSFER 100000000000 is E303, not E506; X:276 TRANSFER 1000001 is E506", async () => {
    await openAccounts(2);
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "100000000000"), E303);
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "1000001"), E506);
  });
  test("X:230 +5, X:231 1e3, X:232 ' 5', X:168 0500, 0, negative and decimal amounts stay E303", async () => {
    await openAccounts(1);
    for (const amount of ["+5", "1e3", " 5", "0500", "0", "-5", "1.5"]) {
      assert.deepEqual(await signed("DEPOSITO", "AC-0001", amount), E303, `amount ${JSON.stringify(amount)}`);
    }
  });
});

describe("R6: the CONSULTA saldo is a string with two decimals", () => {
  const cases: Array<[string, number, string]> = [
    ["X:119", 0, "0.00"],
    ["X:176", 1, "0.01"],
    ["X:122", 40000, "400.00"],
    ["X:157", -500, "-5.00"],
    ["X:228", -5, "-0.05"],
    ["X:249", -1000, "-10.00"],
    ["X:281", 19999999998, "199999999.98"],
  ];
  for (const [evidence, cents, text] of cases) {
    test(`commands.formatCents(${cents}) is "${text}" (${evidence})`, () => {
      assert.equal(commands.formatCents(cents), text);
    });
  }

  test("X:176 the CONSULTA body carries the string saldo", async () => {
    await openAccounts(1);
    await signed("DEPOSITO", "AC-0001", "1");
    assert.deepEqual((await signed("CONSULTA", "AC-0001")).body, { cuenta_id: "AC-0001", saldo: "0.01" });
  });
});

describe("R7: TRANSFER validation order E303 -> E304 -> E401 -> E506 -> E507", () => {
  test("X:221 amount 0 with equal unknown accounts is E303", async () => {
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0001", "0"), E303);
  });
  test("X:210 equal unknown accounts is E304, not E401", async () => {
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0001", "100"), E304);
  });
  test("X:222 equal unknown accounts above the limit is E304, not E506", async () => {
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0001", "60000"), E304);
  });
  test("X:78 unknown destination above the limit is E401, not E506", async () => {
    await openAccounts(1);
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0099", "200000"), E401);
  });
  test("X:30 above the limit with insufficient funds is E506, not E507", async () => {
    await openAccounts(2);
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "50001"), E506);
    assert.deepEqual(await signed("TRANSFER", "AC-0001", "AC-0002", "100"), E507);
  });
});

describe("R8: DEPOSITO validation order E303 -> E401", () => {
  test("X:211 non-numeric amount on an unknown account is E303", async () => {
    assert.deepEqual(await signed("DEPOSITO", "AC-0001", "abc"), E303);
  });
  test("a valid amount on an unknown account is E401", async () => {
    assert.deepEqual(await signed("DEPOSITO", "AC-0001", "100"), E401);
  });
});

describe("R9: the control of non-PING commands is 1 or 2 digits (E201 otherwise)", () => {
  const E201 = { status: 400, body: { error: "E201", mensaje: "control mal formado" } };
  const cases: Array<[string, string]> = [
    ["X:282 a leading zero (050, valid value 50) is E201", "ALTA;Ana;050"],
    ["X:285 three digits (150) is E201, not E202", "ALTA;Ana;150"],
    ["X:283 a plus sign (+50) is E201", "ALTA;Ana;+50"],
    ["X:284 a space (' 50') is E201", "ALTA;Ana; 50"],
  ];
  for (const [name, m] of cases) {
    test(name, async () => {
      assert.deepEqual(await raw(m), E201);
    });
  }

  test("E:4 a single-digit control (ALTA;Mateo;3) is accepted", async () => {
    assert.deepEqual(await raw("ALTA;Mateo;3"), { status: 201, body: { cuentaId: "AC-0001" } });
  });

  test("X:58 / X:142 PING ignores the control format, so PING;064 stays 200 pong", async () => {
    assert.deepEqual(await raw("PING;064"), PONG);
  });
});
