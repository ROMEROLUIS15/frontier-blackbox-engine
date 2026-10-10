import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createServer, createShutdown } from "../src/http/server.ts";
import type { Logger, ShutdownTarget } from "../src/http/server.ts";

const silent: Logger = { info: () => {}, error: () => {} };

function fakeServer(): ShutdownTarget & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    close: (cb) => {
      calls.push("close");
      cb?.();
    },
    closeIdleConnections: () => calls.push("closeIdle"),
    closeAllConnections: () => calls.push("closeAll"),
  };
}

test("shutdown closes the server once, even when signalled twice", () => {
  const server = fakeServer();
  const shutdown = createShutdown(server, silent, 10_000);
  shutdown("SIGTERM");
  shutdown("SIGINT");
  assert.deepEqual(server.calls, ["close", "closeIdle"]);
});

test("shutdown forces remaining connections closed after the timeout", async () => {
  const server = fakeServer();
  createShutdown(server, silent, 10)("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.deepEqual(server.calls, ["close", "closeIdle", "closeAll"]);
});

test("shutdown logs the signal without secrets", () => {
  const lines: string[] = [];
  createShutdown(fakeServer(), { info: (l) => lines.push(l), error: (l) => lines.push(l) }, 10_000)("SIGTERM");
  assert.ok(lines.some((l) => l.includes('"signal":"SIGTERM"')), lines.join("\n"));
});

test("a real server stops accepting connections after shutdown", async () => {
  const server = createServer("tok", silent);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const closed = new Promise<void>((resolve) => server.once("close", () => resolve()));
  createShutdown(server, silent, 1_000)("SIGTERM");
  await closed;
  await assert.rejects(fetch(`http://127.0.0.1:${port}/health`));
});
