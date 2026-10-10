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

test("replay pruebas/ejemplos.jsonl", async () => {
  await post("/__reset", {});
  const lines = readJsonl<{ n: number; request: unknown; status: number; response: unknown }>("pruebas/ejemplos.jsonl");
  assert.equal(lines.length, 20);
  for (const l of lines) {
    const res = await post("/msg", l.request);
    assert.equal(res.status, l.status, `example n=${l.n} status`);
    assert.deepEqual(await res.json(), l.response, `example n=${l.n} body`);
  }
});

test("replay experimentos.jsonl s-ctl-01 with X-Req", async () => {
  await post("/__reset", {});
  const lines = readJsonl<{ seq: string; x_req: number; request: unknown; status: number; response: unknown }>(
    "experimentos.jsonl",
  ).filter((l) => l.seq === "s-ctl-01");
  assert.equal(lines.length, 5);
  for (const l of lines) {
    const res = await post("/msg", l.request);
    assert.equal(res.status, l.status);
    assert.deepEqual(await res.json(), l.response);
    assert.equal(res.headers.get("x-req"), String(l.x_req));
  }
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
