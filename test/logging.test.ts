import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createServer } from "../src/http/server.ts";

const TOKEN = "secret-test-token";

async function withServer(run: (base: string, lines: string[]) => Promise<void>): Promise<void> {
  const lines: string[] = [];
  const server = createServer(TOKEN, { info: (l) => lines.push(l), error: (l) => lines.push(l) });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`, lines);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

test("logs one structured line per request with method, path, status and duration", async () => {
  await withServer(async (base, lines) => {
    const res = await fetch(base + "/msg", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ m: "PING;64" }),
    });
    await res.text();
    await settle();
    assert.equal(lines.length, 1);
    const entry: unknown = JSON.parse(lines[0] ?? "");
    assert.ok(typeof entry === "object" && entry !== null);
    assert.equal(Reflect.get(entry, "method"), "POST");
    assert.equal(Reflect.get(entry, "path"), "/msg");
    assert.equal(Reflect.get(entry, "status"), 200);
    assert.equal(typeof Reflect.get(entry, "ms"), "number");
  });
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("each request log carries its own correlation id, never sent in the response", async () => {
  await withServer(async (base, lines) => {
    const responses: Response[] = [];
    for (let i = 0; i < 2; i++) {
      const res = await fetch(base + "/msg", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ m: "PING;64" }),
      });
      await res.text();
      responses.push(res);
    }
    await settle();
    const ids = lines.map((l) => {
      const entry: unknown = JSON.parse(l);
      assert.ok(typeof entry === "object" && entry !== null);
      const id = Reflect.get(entry, "id");
      assert.ok(typeof id === "string" && UUID.test(id), `bad id in ${l}`);
      return id;
    });
    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1]);
    for (const res of responses) {
      for (const [, value] of res.headers) assert.ok(!ids.includes(value), "correlation id leaked into a header");
      assert.equal(res.headers.get("x-req") !== null, true, "X-Req must still be present");
    }
  });
});

test("log lines never contain the token, auth header or request body", async () => {
  await withServer(async (base, lines) => {
    for (const authorization of [`Bearer ${TOKEN}`, "Bearer wrong-token"]) {
      const res = await fetch(base + "/msg?x=1", {
        method: "POST",
        headers: { "content-type": "application/json", authorization },
        body: JSON.stringify({ m: "ALTA;Lucia;82" }),
      });
      await res.text();
    }
    await settle();
    assert.equal(lines.length, 2);
    for (const line of lines) {
      assert.ok(!line.includes(TOKEN), "token leaked");
      assert.ok(!line.includes("wrong-token"), "auth header leaked");
      assert.ok(!line.includes("Bearer"), "auth scheme leaked");
      assert.ok(!line.includes("Lucia"), "body leaked");
      assert.ok(!line.includes("x=1"), "query string leaked");
    }
  });
});
