import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createServer } from "../src/http/server.ts";

const TOKEN = "test-token";
const root = join(import.meta.dirname, "..");

function readJsonl<T>(file: string): T[] {
  return readFileSync(join(root, file), "utf8")
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as T);
}

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

async function post(path: string, body: unknown, token: string = TOKEN): Promise<Response> {
  return fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

test("reset returns 200 {ok:true}", async () => {
  const res = await post("/__reset", {});
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("replay pruebas/ejemplos.jsonl against the v2 responses recorded in s-ej-01-v2 (X:115-134)", async () => {
  await post("/__reset", {});
  const lines = readJsonl<{ n: number; request: unknown; status: number; response: unknown }>("pruebas/ejemplos.jsonl");
  assert.equal(lines.length, 20);
  // Version 2 changed some responses of the official examples (e.g. the saldo is now a string), so the expected
  // responses come from the v2 log, after checking that it recorded exactly the same requests.
  const v2 = readJsonl<{ seq: string; request: unknown; status: number; response: unknown }>("experimentos.jsonl").filter(
    (x) => x.seq === "s-ej-01-v2",
  );
  assert.equal(v2.length, lines.length);
  for (const [i, l] of lines.entries()) {
    const expected = v2[i];
    assert.ok(expected);
    assert.deepEqual(expected.request, l.request, `example n=${l.n} request matches the v2 log`);
    const res = await post("/msg", l.request);
    assert.equal(res.status, expected.status, `example n=${l.n} status`);
    assert.deepEqual(await res.json(), expected.response, `example n=${l.n} body`);
  }
});

test("replay experimentos.jsonl s-ctl-01 with X-Req on a fresh server", async () => {
  // Observed: these were the first five authorized /msg requests of the token (X-Req 1..5).
  const fresh = createServer(TOKEN);
  await new Promise<void>((resolve) => fresh.listen(0, "127.0.0.1", resolve));
  const freshBase = `http://127.0.0.1:${(fresh.address() as AddressInfo).port}`;
  try {
    const lines = readJsonl<{ seq: string; x_req: number; request: unknown; status: number; response: unknown }>(
      "experimentos.jsonl",
    ).filter((l) => l.seq === "s-ctl-01");
    assert.equal(lines.length, 5);
    for (const l of lines) {
      const res = await fetch(freshBase + "/msg", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify(l.request),
      });
      assert.equal(res.status, l.status);
      assert.deepEqual(await res.json(), l.response);
      assert.equal(res.headers.get("x-req"), String(l.x_req));
    }
  } finally {
    await new Promise<void>((resolve) => fresh.close(() => resolve()));
  }
});

interface LoggedRequest {
  id: number;
  seq: string;
  method: string;
  path: string;
  auth: "team" | "none" | "wrong";
  request: unknown;
  status: number;
  response: unknown;
}

async function replayLogged(l: LoggedRequest): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (l.auth === "team") headers["authorization"] = `Bearer ${TOKEN}`;
  if (l.auth === "wrong") headers["authorization"] = "Bearer wrong-token";
  const body = l.request === null ? undefined : typeof l.request === "string" ? l.request : JSON.stringify(l.request);
  return fetch(base + l.path, { method: l.method, headers, body });
}

for (const seq of ["s-io-01-v2", "s-amt-01-v2"]) {
  test(`replay experimentos.jsonl ${seq} (routes, auth, body, amounts, limit 50000)`, async () => {
    await post("/__reset", {});
    const lines = readJsonl<LoggedRequest>("experimentos.jsonl").filter((l) => l.seq === seq);
    assert.ok(lines.length > 0);
    for (const l of lines) {
      const res = await replayLogged(l);
      assert.equal(res.status, l.status, `experimentos id=${l.id} status`);
      assert.deepEqual(await res.json(), l.response, `experimentos id=${l.id} body`);
    }
  });
}

test("X-Req is not reset by /__reset (experimentos ids 18 -> 19)", async () => {
  const first = await post("/msg", { m: "PING;64" });
  const before = Number(first.headers.get("x-req"));
  await post("/__reset", {});
  const next = await post("/msg", { m: "PING;64" });
  assert.equal(Number(next.headers.get("x-req")), before + 1);
});

test("s-diag-01 with wrong token returns 401 E001 without X-Req", async () => {
  const l = readJsonl<{ seq: string; request: unknown; status: number; response: unknown }>("experimentos.jsonl").find(
    (x) => x.seq === "s-diag-01",
  );
  assert.ok(l);
  const res = await post("/msg", l.request, "wrong-token");
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: "E001", mensaje: "no autorizado" });
  assert.equal(res.headers.get("x-req"), null);
});
