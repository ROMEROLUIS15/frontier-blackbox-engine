// @vitest-environment node
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { SANDBOX_LIMITS } from "../contract/sandbox-api.ts";
import type { SandboxRequest } from "../contract/sandbox-api.ts";
import { createBffServer } from "./bff-server.ts";
import type { BffServerOptions } from "./bff-server.ts";

const TEST_TOKEN = "test-internal-token-do-not-leak";
const silentLogger = { info: () => undefined, error: () => undefined };

interface Reply {
  status: number;
  headers: Headers;
  text: string;
  json: unknown;
}

const runningServers: Server[] = [];

function isAddressInfo(address: string | AddressInfo | null): address is AddressInfo {
  return typeof address === "object" && address !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function startBff(options: BffServerOptions = {}): Promise<string> {
  const server = createBffServer({ logger: silentLogger, createToken: () => TEST_TOKEN, ...options });
  runningServers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!isAddressInfo(address)) throw new Error("server is not listening");
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  const closing = runningServers.splice(0).map(
    (server) =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  await Promise.all(closing);
});

async function call(baseUrl: string, method: string, path: string, body?: string): Promise<Reply> {
  const response = await fetch(baseUrl + path, { method, body, headers: { "content-type": "application/json" } });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, headers: response.headers, text, json };
}

async function createSession(baseUrl: string): Promise<string> {
  const reply = await call(baseUrl, "POST", "/api/sandbox/sessions");
  if (!isRecord(reply.json) || typeof reply.json.sessionId !== "string") throw new Error("no session created");
  return reply.json.sessionId;
}

function send(baseUrl: string, sessionId: string, request: SandboxRequest): Promise<Reply> {
  return call(baseUrl, "POST", `/api/sandbox/sessions/${sessionId}/requests`, JSON.stringify(request));
}

function message(text: string): SandboxRequest {
  return { method: "POST", path: "/msg", body: JSON.stringify({ m: text }) };
}

describe("sandbox sessions", () => {
  it("creates a session and forwards PING to a real replica", async () => {
    const baseUrl = await startBff();
    const created = await call(baseUrl, "POST", "/api/sandbox/sessions");
    expect(created.status).toBe(201);
    expect(created.json).toMatchObject({ sessionId: expect.any(String), expiresAt: expect.any(String) });

    const sessionId = await createSession(baseUrl);
    const exchange = await send(baseUrl, sessionId, { method: "POST", path: "/msg", body: '{"m":"PING;64"}' });
    expect(exchange.status).toBe(200);
    expect(exchange.json).toMatchObject({ status: 200, body: { pong: true }, xReq: "1", sequence: 1 });
  });

  it("isolates state between sessions", async () => {
    const baseUrl = await startBff();
    const sessionA = await createSession(baseUrl);
    const sessionB = await createSession(baseUrl);

    const firstInA = await send(baseUrl, sessionA, message("ALTA;Lucia;82"));
    const secondInA = await send(baseUrl, sessionA, message("ALTA;Lucia;82"));
    const firstInB = await send(baseUrl, sessionB, message("ALTA;Lucia;82"));

    expect(firstInA.json).toMatchObject({ body: { cuentaId: "AC-0001" } });
    expect(secondInA.json).toMatchObject({ body: { cuentaId: "AC-0002" } });
    expect(firstInB.json).toMatchObject({ body: { cuentaId: "AC-0001" }, xReq: "1" });
  });

  it("resets the sandbox through POST /__reset", async () => {
    const baseUrl = await startBff();
    const sessionId = await createSession(baseUrl);
    await send(baseUrl, sessionId, message("ALTA;Lucia;82"));
    const reset = await send(baseUrl, sessionId, { method: "POST", path: "/__reset", body: "{}" });
    expect(reset.json).toMatchObject({ status: 200, body: { ok: true } });
    const again = await send(baseUrl, sessionId, message("ALTA;Lucia;82"));
    expect(again.json).toMatchObject({ body: { cuentaId: "AC-0001" } });
  });

  it("answers 404 for unknown sessions and deletes sessions once", async () => {
    const baseUrl = await startBff();
    const unknown = await send(baseUrl, "00000000-0000-4000-8000-000000000000", message("PING;64"));
    expect(unknown.status).toBe(404);
    expect(unknown.json).toMatchObject({ error: { code: "SESSION_NOT_FOUND" } });

    const sessionId = await createSession(baseUrl);
    expect((await call(baseUrl, "DELETE", `/api/sandbox/sessions/${sessionId}`)).status).toBe(204);
    const secondDelete = await call(baseUrl, "DELETE", `/api/sandbox/sessions/${sessionId}`);
    expect(secondDelete.status).toBe(404);
    expect(secondDelete.json).toMatchObject({ error: { code: "SESSION_NOT_FOUND" } });
    expect((await send(baseUrl, sessionId, message("PING;64"))).status).toBe(404);
  });

  it("expires idle sessions", async () => {
    const baseUrl = await startBff({ limits: { ...SANDBOX_LIMITS, sessionTtlMs: 1 } });
    const sessionId = await createSession(baseUrl);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const reply = await send(baseUrl, sessionId, message("PING;64"));
    expect(reply.json).toMatchObject({ error: { code: "SESSION_NOT_FOUND" } });
  });
});

describe("limits and validation", () => {
  it("rejects bodies over 4096 bytes with 413", async () => {
    const baseUrl = await startBff();
    const sessionId = await createSession(baseUrl);
    const oversized = JSON.stringify({ method: "POST", path: "/msg", body: "x".repeat(5_000) });
    const reply = await call(baseUrl, "POST", `/api/sandbox/sessions/${sessionId}/requests`, oversized);
    expect(reply.status).toBe(413);
    expect(reply.json).toMatchObject({ error: { code: "PAYLOAD_TOO_LARGE" } });
  });

  it("rejects forwarded bodies over 2048 bytes with 400", async () => {
    const baseUrl = await startBff();
    const sessionId = await createSession(baseUrl);
    const reply = await send(baseUrl, sessionId, { method: "POST", path: "/msg", body: "x".repeat(3_000) });
    expect(reply.status).toBe(400);
  });

  it.each([
    { method: "GET", path: "http://evil" },
    { method: "GET", path: "/../x" },
    { method: "GET", path: "/health?x=1" },
    { method: "PUT", path: "/health" },
    { method: "GET", path: "/health", extra: true },
    { method: "POST", path: "/msg", body: 42 },
  ])("rejects invalid request %j with 400", async (invalid) => {
    const baseUrl = await startBff();
    const sessionId = await createSession(baseUrl);
    const reply = await call(
      baseUrl,
      "POST",
      `/api/sandbox/sessions/${sessionId}/requests`,
      JSON.stringify(invalid),
    );
    expect(reply.status).toBe(400);
    expect(reply.json).toMatchObject({ error: { code: "INVALID_REQUEST" } });
  });

  it("rejects malformed JSON with 400", async () => {
    const baseUrl = await startBff();
    const sessionId = await createSession(baseUrl);
    const reply = await call(baseUrl, "POST", `/api/sandbox/sessions/${sessionId}/requests`, "{not json");
    expect(reply.status).toBe(400);
  });

  it("answers 429 SESSION_LIMIT past maxSessions", async () => {
    const baseUrl = await startBff({ limits: { ...SANDBOX_LIMITS, maxSessions: 2 } });
    await createSession(baseUrl);
    await createSession(baseUrl);
    const third = await call(baseUrl, "POST", "/api/sandbox/sessions");
    expect(third.status).toBe(429);
    expect(third.json).toMatchObject({ error: { code: "SESSION_LIMIT" } });
  });

  it("answers 429 RATE_LIMITED past the per-session budget", async () => {
    const baseUrl = await startBff({ limits: { ...SANDBOX_LIMITS, maxRequestsPerMinutePerSession: 2 } });
    const sessionId = await createSession(baseUrl);
    await send(baseUrl, sessionId, message("PING;64"));
    await send(baseUrl, sessionId, message("PING;64"));
    const limited = await send(baseUrl, sessionId, message("PING;64"));
    expect(limited.status).toBe(429);
    expect(limited.json).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });
});

describe("secrets and headers", () => {
  it("never exposes the internal token in any response", async () => {
    const baseUrl = await startBff();
    const sessionId = await createSession(baseUrl);
    const replies = [
      await send(baseUrl, sessionId, message("PING;64")),
      await send(baseUrl, sessionId, { method: "GET", path: "/health" }),
      await send(baseUrl, sessionId, { method: "GET", path: "/nope" }),
      await send(baseUrl, sessionId, { method: "GET", path: "/../x" }),
      await call(baseUrl, "GET", "/api/experiments"),
    ];
    for (const reply of replies) {
      const headerDump = JSON.stringify([...reply.headers.entries()]);
      expect(reply.text).not.toContain(TEST_TOKEN);
      expect(headerDump).not.toContain(TEST_TOKEN);
    }
  });

  it("does not log tokens, bodies or full session ids", async () => {
    const lines: string[] = [];
    const baseUrl = await startBff({ logger: { info: (line) => lines.push(line), error: (line) => lines.push(line) } });
    const sessionId = await createSession(baseUrl);
    await send(baseUrl, sessionId, message("PING;64"));
    const output = lines.join("\n");
    expect(lines.length).toBeGreaterThan(0);
    expect(output).not.toContain(TEST_TOKEN);
    expect(output).not.toContain(sessionId);
    expect(output).not.toContain("PING");
    expect(output).toContain(sessionId.slice(0, 8));
  });

  it("sets hardening headers on JSON responses", async () => {
    const baseUrl = await startBff();
    const reply = await call(baseUrl, "GET", "/api/experiments");
    expect(reply.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(reply.headers.get("cache-control")).toBe("no-store");
    expect(reply.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("catalog and routing", () => {
  it("serves the 50 experiments with ids 1..50", async () => {
    const baseUrl = await startBff();
    const reply = await call(baseUrl, "GET", "/api/experiments");
    expect(reply.status).toBe(200);
    expect(reply.json).toMatchObject({
      experiments: Array.from({ length: 50 }, (_, index) => ({ id: index + 1 })),
    });
    expect(isRecord(reply.json) && Array.isArray(reply.json.experiments) && reply.json.experiments.length).toBe(50);
  });

  it("answers 404 NOT_FOUND for unknown routes", async () => {
    const baseUrl = await startBff();
    for (const [method, path] of [["GET", "/api/unknown"], ["GET", "/"], ["GET", "/api/sandbox/sessions"]]) {
      const reply = await call(baseUrl, method ?? "GET", path ?? "/");
      expect(reply.status).toBe(404);
      expect(reply.json).toMatchObject({ error: { code: "NOT_FOUND" } });
    }
  });
});
