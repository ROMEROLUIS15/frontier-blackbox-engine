import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createServer } from "../src/http/server.ts";

const TOKEN = "test-token";
const root = join(import.meta.dirname, "..");

type Auth = "team" | "wrong" | "none" | "bearer-lower" | "no-scheme";

interface LoggedExperiment {
  id: number;
  seq: string;
  version?: string;
  method: string;
  path: string;
  auth: Auth;
  request: unknown;
  status: number;
  response: unknown;
}

// Trusted fixture: experimentos.jsonl is the log of real requests to the original service.
// Only the lines tagged "version":"v2" are replayed: they are the ground truth for the current behavior.
function readV2Experiments(): LoggedExperiment[] {
  return readFileSync(join(root, "experimentos.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as LoggedExperiment)
    .filter((e) => e.version === "v2");
}

async function startServer(): Promise<{ server: Server; base: string }> {
  const server = createServer(TOKEN);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

function authorizationFor(auth: Auth): Record<string, string> {
  if (auth === "team") return { authorization: `Bearer ${TOKEN}` };
  if (auth === "wrong") return { authorization: "Bearer wrong-token" };
  if (auth === "bearer-lower") return { authorization: `bearer ${TOKEN}` };
  if (auth === "no-scheme") return { authorization: TOKEN };
  return {};
}

// The log does not record Content-Type. X:264 was sent as text/plain; the replica ignores Content-Type,
// so application/json is equivalent here.
async function send(
  base: string,
  method: string,
  path: string,
  auth: Auth,
  request: unknown,
): Promise<{ status: number; text: string }> {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...authorizationFor(auth) },
    // X:15 logs a raw non-JSON body as a string; other bodies are logged as parsed JSON; null means no body.
    body: request === null ? undefined : typeof request === "string" ? request : JSON.stringify(request),
  });
  return { status: res.status, text: await res.text() };
}

async function message(base: string, m: string): Promise<{ status: number; body: unknown }> {
  const reply = await send(base, "POST", "/msg", "team", { m });
  return { status: reply.status, body: JSON.parse(reply.text) };
}

// A logged string response (HEAD gives "") is compared as exact text; anything else as parsed JSON.
function sameResponse(actualText: string, expected: unknown): boolean {
  if (typeof expected === "string") return actualText === expected;
  try {
    return JSON.stringify(JSON.parse(actualText)) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

const experiments = readV2Experiments();
const sequences = [...new Set(experiments.map((e) => e.seq))];

describe("equivalence with version 2 of the original: every v2 line of experimentos.jsonl", () => {
  test("the log holds the 226 v2 lines", () => {
    assert.equal(experiments.length, 226);
  });

  for (const seq of sequences) {
    test(`replay ${seq}`, async () => {
      const { server, base } = await startServer();
      try {
        await send(base, "POST", "/__reset", "team", {});
        const failures: string[] = [];
        for (const e of experiments.filter((x) => x.seq === seq)) {
          const actual = await send(base, e.method, e.path, e.auth, e.request);
          if (actual.status !== e.status || !sameResponse(actual.text, e.response)) {
            failures.push(
              `id=${e.id} expected ${e.status} ${JSON.stringify(e.response)} but got ${actual.status} ${actual.text}`,
            );
          }
        }
        assert.deepEqual(failures, [], `failing ids in ${seq}:\n${failures.join("\n")}`);
      } finally {
        await stopServer(server);
      }
    });
  }
});

describe("same-account TRANSFER is rejected without mutation (mirrors X:79-81)", () => {
  test("E304 consumes no operation id and leaves the balance unchanged", async () => {
    const { server, base } = await startServer();
    try {
      await send(base, "POST", "/__reset", "team", {});
      await message(base, "ALTA;Ana;50");
      assert.deepEqual((await message(base, "DEPOSITO;AC-0001;500;46")).body, { status: "recieved", operacionId: "OP-0001" });
      const rejected = await message(base, "TRANSFER;AC-0001;AC-0001;100;17");
      assert.equal(rejected.status, 400);
      assert.deepEqual(rejected.body, { error: "E304", mensaje: "origen y destino iguales" });
      assert.deepEqual((await message(base, "DEPOSITO;AC-0001;100;82")).body, { status: "recieved", operacionId: "OP-0002" });
      assert.deepEqual((await message(base, "CONSULTA;AC-0001;14")).body, { cuenta_id: "AC-0001", saldo: "6.00" });
    } finally {
      await stopServer(server);
    }
  });
});
