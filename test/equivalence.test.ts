import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createServer } from "../src/http/server.ts";

const TOKEN = "test-token";
const root = join(import.meta.dirname, "..");

interface LoggedExperiment {
  id: number;
  seq: string;
  method?: string;
  path?: string;
  auth?: "team" | "none" | "wrong";
  request: unknown;
  status: number;
  response: unknown;
}

// Trusted fixture: experimentos.jsonl is the log of real requests to the original service.
function readExperiments(): LoggedExperiment[] {
  return readFileSync(join(root, "experimentos.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as LoggedExperiment);
}

async function startServer(): Promise<{ server: Server; base: string }> {
  const server = createServer(TOKEN);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

function authorizationFor(auth: "team" | "none" | "wrong"): Record<string, string> {
  if (auth === "team") return { authorization: `Bearer ${TOKEN}` };
  if (auth === "wrong") return { authorization: "Bearer wrong-token" };
  return {};
}

async function send(
  base: string,
  method: string,
  path: string,
  auth: "team" | "none" | "wrong",
  request: unknown,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...authorizationFor(auth) },
    // X:15 logs a raw non-JSON body as a string; every other body is logged as parsed JSON.
    body: request === null ? undefined : typeof request === "string" ? request : JSON.stringify(request),
  });
  return { status: res.status, body: await res.json() };
}

async function message(base: string, m: string): Promise<{ status: number; body: unknown }> {
  return send(base, "POST", "/msg", "team", { m });
}

// X:1 predates the `auth` field: its log text states the request used a wrong token (answered 401 E001).
function authOf(e: LoggedExperiment): "team" | "none" | "wrong" {
  return e.auth ?? (e.id === 1 ? "wrong" : "team");
}

const experiments = readExperiments();
const sequences = [...new Set(experiments.map((e) => e.seq))];

describe("equivalence with the original: every line of experimentos.jsonl", () => {
  for (const seq of sequences) {
    test(`replay ${seq}`, async () => {
      const { server, base } = await startServer();
      try {
        await send(base, "POST", "/__reset", "team", {});
        const failures: string[] = [];
        for (const e of experiments.filter((x) => x.seq === seq)) {
          const actual = await send(base, e.method ?? "POST", e.path ?? "/msg", authOf(e), e.request);
          const matches = actual.status === e.status && JSON.stringify(actual.body) === JSON.stringify(e.response);
          if (!matches) {
            failures.push(
              `id=${e.id} expected ${e.status} ${JSON.stringify(e.response)} but got ${actual.status} ${JSON.stringify(actual.body)}`,
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
      assert.deepEqual((await message(base, "CONSULTA;AC-0001;14")).body, { cuenta_id: "AC-0001", saldo: 600 });
    } finally {
      await stopServer(server);
    }
  });
});

describe("ASSUMPTION / characterization (not demonstrated against the original)", () => {
  test("ASSUMPTION: an empty message m stays E201 (only non-empty messages without ';' are shown to be E103, X:60)", async () => {
    const { server, base } = await startServer();
    try {
      const reply = await message(base, "");
      assert.equal(reply.status, 400);
      assert.deepEqual(reply.body, { error: "E201", mensaje: "control mal formado" });
    } finally {
      await stopServer(server);
    }
  });
});
